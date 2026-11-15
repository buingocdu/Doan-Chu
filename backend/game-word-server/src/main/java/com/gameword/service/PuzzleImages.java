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
        return new Processed(encodeJpeg(out), nw, nh);
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
