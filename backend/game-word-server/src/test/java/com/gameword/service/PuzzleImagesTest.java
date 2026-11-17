package com.gameword.service;

import com.gameword.config.PuzzleConfig;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PuzzleImagesTest {

    private final PuzzleConfig config = new PuzzleConfig();

    private static byte[] png(int w, int h) throws Exception {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }

    @Test
    void largeImageIsScaledDownAndEncodedAsJpeg() throws Exception {
        PuzzleImages.Processed result = PuzzleImages.process(png(3200, 1600), config);
        assertEquals(1600, result.width());
        assertEquals(800, result.height());
        BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(result.data()));
        assertEquals(1600, decoded.getWidth());
        // JPEG bat dau bang FF D8
        assertEquals((byte) 0xFF, result.data()[0]);
        assertEquals((byte) 0xD8, result.data()[1]);
    }

    @Test
    void smallEnoughImageKeepsItsSize() throws Exception {
        PuzzleImages.Processed result = PuzzleImages.process(png(600, 400), config);
        assertEquals(600, result.width());
        assertEquals(400, result.height());
    }

    @Test
    void rejectsTooSmallImage() throws Exception {
        RuntimeException ex = assertThrows(RuntimeException.class, () -> PuzzleImages.process(png(100, 100), config));
        assertEquals("Image too small", ex.getMessage());
    }

    @Test
    void rejectsNonImageContent() {
        byte[] script = "<script>alert(1)</script>".getBytes();
        RuntimeException ex = assertThrows(RuntimeException.class, () -> PuzzleImages.process(script, config));
        assertEquals("Unsupported image format", ex.getMessage());
    }

    // JPEG 600x400, nen trang, o do 80x80 o goc tren-trai, kem khoi EXIF co Orientation
    private static byte[] jpegWithOrientation(int orientation, boolean littleEndian) throws Exception {
        BufferedImage img = new BufferedImage(600, 400, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < 400; y++) {
            for (int x = 0; x < 600; x++) {
                img.setRGB(x, y, x < 80 && y < 80 ? 0xFF0000 : 0xFFFFFF);
            }
        }
        ByteArrayOutputStream plain = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", plain);
        byte[] jpeg = plain.toByteArray();
        if (orientation == 0) {
            return jpeg; // khong co EXIF
        }
        ByteArrayOutputStream tiff = new ByteArrayOutputStream();
        byte[] order = littleEndian ? new byte[] {'I', 'I'} : new byte[] {'M', 'M'};
        tiff.write(order);
        tiff.write(littleEndian ? new byte[] {0x2A, 0} : new byte[] {0, 0x2A});
        tiff.write(littleEndian ? new byte[] {8, 0, 0, 0} : new byte[] {0, 0, 0, 8});
        tiff.write(littleEndian ? new byte[] {1, 0} : new byte[] {0, 1}); // 1 muc
        tiff.write(littleEndian ? new byte[] {0x12, 0x01, 3, 0, 1, 0, 0, 0, (byte) orientation, 0, 0, 0}
            : new byte[] {0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, (byte) orientation, 0, 0});
        tiff.write(new byte[] {0, 0, 0, 0}); // het IFD
        byte[] body = tiff.toByteArray();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(jpeg, 0, 2); // FF D8
        int length = 2 + 6 + body.length;
        out.write(new byte[] {(byte) 0xFF, (byte) 0xE1, (byte) (length >> 8), (byte) length});
        out.write(new byte[] {'E', 'x', 'i', 'f', 0, 0});
        out.write(body);
        out.write(jpeg, 2, jpeg.length - 2);
        return out.toByteArray();
    }

    private static boolean isRed(BufferedImage img, int x, int y) {
        int rgb = img.getRGB(x, y);
        return ((rgb >> 16) & 0xFF) > 200 && ((rgb >> 8) & 0xFF) < 90 && (rgb & 0xFF) < 90;
    }

    @Test
    void readsExifOrientationInBothByteOrders() throws Exception {
        for (int o = 1; o <= 8; o++) {
            assertEquals(o, PuzzleImages.exifOrientation(jpegWithOrientation(o, false)));
            assertEquals(o, PuzzleImages.exifOrientation(jpegWithOrientation(o, true)));
        }
        assertEquals(1, PuzzleImages.exifOrientation(jpegWithOrientation(0, false)));
        assertEquals(1, PuzzleImages.exifOrientation(new byte[] {1, 2, 3}));
        assertEquals(1, PuzzleImages.exifOrientation(png(500, 500)));
    }

    @Test
    void portraitPhotoStoredSidewaysIsRotatedUpright() throws Exception {
        // Orientation 6: anh luu 600x400 nhung phai xoay 90 phai de hien thi => anh dung 400x600
        PuzzleImages.Processed result = PuzzleImages.process(jpegWithOrientation(6, false), config);
        assertEquals(400, result.width());
        assertEquals(600, result.height());
        BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(result.data()));
        assertEquals(400, decoded.getWidth());
        assertEquals(600, decoded.getHeight());
        // O do goc tren-trai cua anh luu chuyen sang goc tren-phai sau khi xoay 90 phai
        assertTrue(isRed(decoded, 360, 30));
        assertFalse(isRed(decoded, 30, 30));
    }

    @Test
    void orientationsMoveTheMarkerAndSwapDimensionsAsExifSpecifies() throws Exception {
        // Vi tri o do (tren-trai cua anh luu 600x400) sau khi ap dung moi gia tri Orientation
        int[][] expected = {
            // orientation, width, height, markerX, markerY (toa do mot diem ben trong o do)
            {1, 600, 400, 30, 30}, {2, 600, 400, 570, 30}, {3, 600, 400, 570, 370}, {4, 600, 400, 30, 370},
            {5, 400, 600, 30, 30}, {6, 400, 600, 370, 30}, {7, 400, 600, 370, 570}, {8, 400, 600, 30, 570},
        };
        for (int[] e : expected) {
            PuzzleImages.Processed r = PuzzleImages.process(jpegWithOrientation(e[0], false), config);
            assertEquals(e[1], r.width(), "width o=" + e[0]);
            assertEquals(e[2], r.height(), "height o=" + e[0]);
            BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(r.data()));
            assertTrue(isRed(decoded, e[3], e[4]), "marker o=" + e[0]);
        }
    }

    @Test
    void imageWithoutExifKeepsItsOrientation() throws Exception {
        PuzzleImages.Processed result = PuzzleImages.process(jpegWithOrientation(0, false), config);
        assertEquals(600, result.width());
        assertEquals(400, result.height());
    }

    @Test
    void rotateStoredImageTurnsItClockwiseAndSwapsDimensions() throws Exception {
        byte[] jpeg = PuzzleImages.process(jpegWithOrientation(0, false), config).data();
        PuzzleImages.Processed right = PuzzleImages.rotate(jpeg, 1);
        assertEquals(400, right.width());
        assertEquals(600, right.height());
        assertTrue(isRed(ImageIO.read(new ByteArrayInputStream(right.data())), 360, 30));
        PuzzleImages.Processed left = PuzzleImages.rotate(jpeg, 3);
        assertTrue(isRed(ImageIO.read(new ByteArrayInputStream(left.data())), 30, 570));
        PuzzleImages.Processed half = PuzzleImages.rotate(jpeg, 2);
        assertEquals(600, half.width());
        assertTrue(isRed(ImageIO.read(new ByteArrayInputStream(half.data())), 570, 370));
    }

    @Test
    void cropKeepsOnlyTheChosenRegion() throws Exception {
        config.setMinImageSide(100);
        byte[] jpeg = PuzzleImages.process(jpegWithOrientation(0, false), config).data(); // 600x400, o do tren-trai
        PuzzleImages.Processed topLeft = PuzzleImages.edit(jpeg, 0, new PuzzleImages.Crop(0, 0, 0.5, 0.5), config);
        assertEquals(300, topLeft.width());
        assertEquals(200, topLeft.height());
        assertTrue(isRed(ImageIO.read(new ByteArrayInputStream(topLeft.data())), 30, 30));

        PuzzleImages.Processed bottomRight = PuzzleImages.edit(jpeg, 0, new PuzzleImages.Crop(0.5, 0.5, 0.5, 0.5), config);
        assertEquals(300, bottomRight.width());
        assertFalse(isRed(ImageIO.read(new ByteArrayInputStream(bottomRight.data())), 30, 30));
    }

    @Test
    void rotateThenCropUsesTheRotatedImageAsReference() throws Exception {
        config.setMinImageSide(100);
        byte[] jpeg = PuzzleImages.process(jpegWithOrientation(0, false), config).data();
        // Xoay phai: 400x600, o do o goc tren-phai. Cat nua phai (x tu 50%) => 200x600, o do o (170,30)
        PuzzleImages.Processed result = PuzzleImages.edit(jpeg, 1, new PuzzleImages.Crop(0.5, 0, 0.5, 1), config);
        assertEquals(200, result.width());
        assertEquals(600, result.height());
        assertTrue(isRed(ImageIO.read(new ByteArrayInputStream(result.data())), 170, 30));
    }

    @Test
    void cropRejectsBadRegionsAndTooSmallResults() throws Exception {
        byte[] jpeg = PuzzleImages.process(jpegWithOrientation(0, false), config).data();
        for (PuzzleImages.Crop bad : new PuzzleImages.Crop[] {
            new PuzzleImages.Crop(-0.1, 0, 0.5, 0.5), new PuzzleImages.Crop(0.6, 0, 0.5, 0.5),
            new PuzzleImages.Crop(0, 0, 0, 0.5), new PuzzleImages.Crop(0, 0.7, 0.5, 0.5)}) {
            RuntimeException ex = assertThrows(RuntimeException.class, () -> PuzzleImages.edit(jpeg, 0, bad, config));
            assertEquals("Invalid crop", ex.getMessage());
        }
        // Mac dinh canh ngan phai >= 300: cat nua anh 600x400 con 200 la qua nho
        RuntimeException small = assertThrows(RuntimeException.class,
            () -> PuzzleImages.edit(jpeg, 0, new PuzzleImages.Crop(0, 0, 0.5, 0.5), config));
        assertEquals("Image too small", small.getMessage());
    }

    @Test
    void rejectsEmptyAndOversizedFiles() {
        assertThrows(RuntimeException.class, () -> PuzzleImages.process(new byte[0], config));
        config.setMaxUploadBytes(10);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> PuzzleImages.process(new byte[11], config));
        assertEquals("Image too large", ex.getMessage());
    }
}
