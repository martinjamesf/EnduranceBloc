# Hero Images

## Required Image

**hero-stairs.jpg**
- Save the stairs/athlete image here
- Recommended size: 1920x1080px or larger for retina displays
- Format: JPG (optimized for web, ~200-500KB)
- The image will be automatically optimized by Next.js

## Image Optimization Notes

Next.js automatically optimizes images for:
- Responsive sizing
- Modern formats (WebP/AVIF when supported)
- Lazy loading (except hero with `priority` prop)
- Proper aspect ratios

The duotone effect applies:
1. Grayscale filter
2. Contrast boost
3. Brand color overlay (orange/teal)
4. Vignette for content focus
