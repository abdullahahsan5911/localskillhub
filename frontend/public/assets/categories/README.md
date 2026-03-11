# Category Images Setup

This directory contains category images for the LocalSkillHub application.

## Directory Structure

```
public/assets/categories/
├── graphic-design.jpg
├── ui-ux-design.jpg
├── illustration.jpg
├── branding.jpg
├── logo-design.jpg
├── typography.jpg
├── print-design.jpg
├── packaging.jpg
├── video-production.jpg
├── animation.jpg
├── motion-graphics.jpg
├── video-editing.jpg
├── 3d-animation.jpg
├── photography.jpg
├── portrait.jpg
├── product-photo.jpg
├── event-photo.jpg
├── web-dev.jpg
├── mobile-dev.jpg
├── frontend.jpg
├── backend.jpg
├── fullstack.jpg
├── content-writing.jpg
├── copywriting.jpg
├── social-media.jpg
├── digital-marketing.jpg
├── seo.jpg
├── fashion.jpg
├── interior.jpg
├── architecture.jpg
├── product-design.jpg
├── industrial.jpg
├── game-design.jpg
├── sound-design.jpg
└── music-production.jpg
```

## Image Specifications

- **Format**: JPG or PNG
- **Size**: 400x400px (square)
- **Quality**: Optimized for web (60-80% quality)
- **File Size**: < 100KB per image
- **Style**: Professional, consistent aesthetic

## Image Sources

You can use images from:

1. **Unsplash** (https://unsplash.com) - Free high-quality images
2. **Pexels** (https://pexels.com) - Free stock photos
3. **Freepik** (https://freepik.com) - Free illustrations and photos
4. **Custom Graphics** - Create your own category illustrations

## Quick Setup with Placeholder Images

If you want to quickly populate with placeholder images:

1. Visit https://placehold.co/400x400
2. Or use the following pattern: `https://placehold.co/400x400/[color]/white?text=[Category+Name]`

Example:
```
graphic-design.jpg → https://placehold.co/400x400/8B5CF6/white?text=Graphic+Design
ui-ux-design.jpg → https://placehold.co/400x400/3B82F6/white?text=UI+UX+Design
```

## Using the Images

Images are automatically loaded by the CategoryCard component. The component includes fallback to icons if images fail to load.

To enable images in components:
```tsx
<CategoryCard
  category={category}
  showImage={true}  // Enable image display
/>
```

## Color Palette Reference

Each category has associated colors defined in `/src/constants/categories.ts`:

- Graphic Design: #8B5CF6 (Purple)
- UI/UX Design: #3B82F6 (Blue)
- Illustration: #EC4899 (Pink)
- Branding: #F59E0B (Amber)
- Photography: #06B6D4 (Cyan)
- Development: #3B82F6 (Blue)
- Content/Marketing: #10B981 (Green)

Use these colors as backgrounds or accents for category images.
