package com.gameword.service;

import com.gameword.config.PuzzleConfig;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

// Giai ma anh upload, kiem tra kich thuoc, thu nho va ma hoa lai thanh JPEG.
// Ma hoa lai loai bo noi dung la (metadata, du lieu gan them) va bao dam file luu luon la anh hop le.
final class PuzzleImages {

    // Chan "bom giai nen": anh nho dung luong nhung hang tram trieu diem anh
    private static final long MAX_PIXELS = 40_000_000L;
    private static final float JPEG_QUALITY = 0.88f;

    record Processed(byte[] data, int width, int height) {
    }

    private PuzzleImages() {
    }

    static Processed process(byte[] raw, PuzzleConfig config) {
        if (raw == null || raw.length == 0) {
            throw new RuntimeException("Image file is required");
        }
        if (raw.length > config.getMaxUploadBytes()) {
            throw new RuntimeException("Image too large");
        }
        BufferedImage source = decode(raw);
        int w = source.getWidth();
        int h = source.getHeight();
        if (Math.min(w, h) < config.getMinImageSide()) {
            throw new RuntimeException("Image too small");
        }
        double scale = Math.min(1.0, (double) config.getMaxImageSide() / Math.max(w, h));
        int nw = Math.max(1, (int) Math.round(w * scale));
        int nh = Math.max(1, (int) Math.round(h * scale));

        BufferedImage out = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        try {
            g.setColor(Color.WHITE); // nen trang cho anh PNG/GIF co kenh trong suot
            g.fillRect(0, 0, nw, nh);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.drawImage(source, 0, 0, nw, nh, null);
        } finally {
            g.dispose();
        }
        // Anh chup tu dien thoai thuong luu "nam ngang" kem co xoay EXIF; ma hoa lai se mat co nay nen phai xoay that su
        BufferedImage oriented = orient(out, exifOrientation(raw));
        return new Processed(encodeJpeg(oriented), oriented.getWidth(), oriented.getHeight());
    }

    // Xoay anh da luu (admin sua anh bi nam ngang): quarterTurns la so lan xoay 90 do theo chieu kim dong ho
    static Processed rotate(byte[] jpeg, int quarterTurns) {
        BufferedImage source = decode(jpeg);
        int turns = ((quarterTurns % 4) + 4) % 4;
        // EXIF 1 = giu nguyen, 6 = xoay 90 phai, 3 = 180, 8 = xoay 90 trai (270 phai)
        int orientation = switch (turns) {
            case 1 -> 6;
            case 2 -> 3;
            case 3 -> 8;
            default -> 1;
        };
        BufferedImage rgb = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        try {
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, rgb.getWidth(), rgb.getHeight());
            g.drawImage(source, 0, 0, null);
        } finally {
            g.dispose();
        }
        BufferedImage oriented = orient(rgb, orientation);
        return new Processed(encodeJpeg(oriented), oriented.getWidth(), oriented.getHeight());
    }

    /** Vung cat theo ti le (0..1) cua anh SAU khi xoay: x, y la goc tren-trai, w, h la rong va cao */
    record Crop(double x, double y, double w, double h) {
    }

    // Sua anh trong kho: xoay truoc roi cat. crop = null thi chi xoay. Cat xong canh ngan van phai >= min-image-side
    static Processed edit(byte[] jpeg, int quarterTurns, Crop crop, PuzzleConfig config) {
        BufferedImage source = decode(jpeg);
        BufferedImage rgb = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        try {
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, rgb.getWidth(), rgb.getHeight());
            g.drawImage(source, 0, 0, null);
        } finally {
            g.dispose();
        }
        int turns = ((quarterTurns % 4) + 4) % 4;
        int orientation = switch (turns) {
            case 1 -> 6;
            case 2 -> 3;
            case 3 -> 8;
            default -> 1;
        };
        BufferedImage result = orient(rgb, orientation);
        if (crop != null) {
            double eps = 1e-6;
            if (!(crop.x() >= -eps && crop.y() >= -eps && crop.w() > 0 && crop.h() > 0
                    && crop.x() + crop.w() <= 1 + eps && crop.y() + crop.h() <= 1 + eps)) {
                throw new RuntimeException("Invalid crop");
            }
            int w = result.getWidth();
            int h = result.getHeight();
            int x0 = (int) Math.max(0, Math.min(w - 1, Math.round(crop.x() * w)));
            int y0 = (int) Math.max(0, Math.min(h - 1, Math.round(crop.y() * h)));
            int cw = (int) Math.max(1, Math.min(w - x0, Math.round(crop.w() * w)));
            int ch = (int) Math.max(1, Math.min(h - y0, Math.round(crop.h() * h)));
            // getSubimage dung chung bo nho voi anh goc; copy ra anh moi de khong giu anh lon trong bo nho
            BufferedImage cropped = new BufferedImage(cw, ch, BufferedImage.TYPE_INT_RGB);
            Graphics2D cg = cropped.createGraphics();
            try {
                cg.drawImage(result.getSubimage(x0, y0, cw, ch), 0, 0, null);
            } finally {
                cg.dispose();
            }
            result = cropped;
        }
        if (Math.min(result.getWidth(), result.getHeight()) < config.getMinImageSide()) {
            throw new RuntimeException("Image too small");
        }
        return new Processed(encodeJpeg(result), result.getWidth(), result.getHeight());
    }

    /** Doc co Orientation (tag 0x0112) trong khoi EXIF cua JPEG; 1 (binh thuong) neu khong co hoac khong doc duoc */
    static int exifOrientation(byte[] data) {
        try {
            // JPEG bat dau bang FF D8, sau do la cac doan marker FF xx <do dai 2 byte>
            if (data.length < 4 || (data[0] & 0xFF) != 0xFF || (data[1] & 0xFF) != 0xD8) {
                return 1;
            }
            int pos = 2;
            while (pos + 4 <= data.length) {
                if ((data[pos] & 0xFF) != 0xFF) {
                    return 1;
                }
                int marker = data[pos + 1] & 0xFF;
                if (marker == 0xFF) { // byte dem
                    pos++;
                    continue;
                }
                if (marker == 0xDA || marker == 0xD9) { // het phan header
                    return 1;
                }
                int length = ((data[pos + 2] & 0xFF) << 8) | (data[pos + 3] & 0xFF);
                if (length < 2) {
                    return 1;
                }
                int start = pos + 4;
                if (marker == 0xE1 && start + 14 <= data.length && data[start] == 'E' && data[start + 1] == 'x'
                        && data[start + 2] == 'i' && data[start + 3] == 'f' && data[start + 4] == 0) {
                    return tiffOrientation(data, start + 6, Math.min(data.length, pos + 2 + length));
                }
                pos += 2 + length;
            }
        } catch (RuntimeException ex) {
            // du lieu EXIF hong: coi nhu khong co
        }
        return 1;
    }

    private static int tiffOrientation(byte[] d, int tiff, int end) {
        if (tiff + 8 > end) {
            return 1;
        }
        boolean little = d[tiff] == 'I' && d[tiff + 1] == 'I';
        if (!little && !(d[tiff] == 'M' && d[tiff + 1] == 'M')) {
            return 1;
        }
        int ifd = tiff + u32(d, tiff + 4, little);
        if (ifd < tiff || ifd + 2 > end) {
            return 1;
        }
        int count = u16(d, ifd, little);
        for (int i = 0; i < count; i++) {
            int entry = ifd + 2 + i * 12;
            if (entry + 12 > end) {
                return 1;
            }
            if (u16(d, entry, little) == 0x0112) {
                int value = u16(d, entry + 8, little);
                return value >= 1 && value <= 8 ? value : 1;
            }
        }
        return 1;
    }

    private static int u16(byte[] d, int p, boolean little) {
        return little ? (d[p] & 0xFF) | ((d[p + 1] & 0xFF) << 8) : ((d[p] & 0xFF) << 8) | (d[p + 1] & 0xFF);
    }

    private static int u32(byte[] d, int p, boolean little) {
        return little
            ? (d[p] & 0xFF) | ((d[p + 1] & 0xFF) << 8) | ((d[p + 2] & 0xFF) << 16) | ((d[p + 3] & 0xFF) << 24)
            : ((d[p] & 0xFF) << 24) | ((d[p + 1] & 0xFF) << 16) | ((d[p + 2] & 0xFF) << 8) | (d[p + 3] & 0xFF);
    }

    /** Ap dung 8 gia tri Orientation cua EXIF len anh (anh moi luon la TYPE_INT_RGB) */
    static BufferedImage orient(BufferedImage src, int orientation) {
        if (orientation <= 1 || orientation > 8) {
            return src;
        }
        int w = src.getWidth();
        int h = src.getHeight();
        boolean swap = orientation >= 5;
        // AffineTransform(m00, m10, m01, m11, m02, m12): x' = m00 x + m01 y + m02, y' = m10 x + m11 y + m12
        AffineTransform t = switch (orientation) {
            case 2 -> new AffineTransform(-1, 0, 0, 1, w, 0);
            case 3 -> new AffineTransform(-1, 0, 0, -1, w, h);
            case 4 -> new AffineTransform(1, 0, 0, -1, 0, h);
            case 5 -> new AffineTransform(0, 1, 1, 0, 0, 0);
            case 6 -> new AffineTransform(0, 1, -1, 0, h, 0);
            case 7 -> new AffineTransform(0, -1, -1, 0, h, w);
            default -> new AffineTransform(0, -1, 1, 0, 0, w); // 8
        };
        BufferedImage out = new BufferedImage(swap ? h : w, swap ? w : h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        try {
            g.drawImage(src, t, null);
        } finally {
            g.dispose();
        }
        return out;
    }

    private static BufferedImage decode(byte[] raw) {
        try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(raw))) {
            Iterator<ImageReader> readers = in == null ? null : ImageIO.getImageReaders(in);
            if (readers == null || !readers.hasNext()) {
                throw new RuntimeException("Unsupported image format");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(in, true, true);
                long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
                if (pixels > MAX_PIXELS) {
                    throw new RuntimeException("Image dimensions too large");
                }
                BufferedImage image = reader.read(0);
                if (image == null) {
                    throw new RuntimeException("Unsupported image format");
                }
                return image;
            } finally {
                reader.dispose();
            }
        } catch (IOException | IllegalArgumentException ex) {
            throw new RuntimeException("Unsupported image format");
        }
    }

    private static byte[] encodeJpeg(BufferedImage image) {
        try {
            ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(JPEG_QUALITY);
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (ImageOutputStream ios = ImageIO.createImageOutputStream(bytes)) {
                writer.setOutput(ios);
                writer.write(null, new IIOImage(image, null, null), param);
            } finally {
                writer.dispose();
            }
            return bytes.toByteArray();
        } catch (IOException ex) {
            throw new RuntimeException("Unsupported image format");
        }
    }
}
