package com.gameword.service;

import com.gameword.config.PuzzleConfig;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

    @Test
    void rejectsEmptyAndOversizedFiles() {
        assertThrows(RuntimeException.class, () -> PuzzleImages.process(new byte[0], config));
        config.setMaxUploadBytes(10);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> PuzzleImages.process(new byte[11], config));
        assertEquals("Image too large", ex.getMessage());
    }
}
