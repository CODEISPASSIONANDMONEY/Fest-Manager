# 🎨 Fest Manager Design System

## Color Palette

### Primary Colors

- **Electric Blue**: `#2563eb` - Main brand color, buttons, links
- **Lavender**: `#8b5cf6` - Secondary accent, gradients
- **Teal**: `#14b8a6` - Success states, ocean gradient
- **Coral**: `#fb7185` - Warnings, sunset gradients
- **Gold**: `#fbbf24` - Highlights, badges
- **Neon Pink**: `#ec4899` - Accent highlights
- **Fresh Green**: `#22c55e` - Success, completed states

### Dark Mode Colors

- **Background**: `#131313` (Primary), `#192655` (Secondary)
- **Teal Accent**: `#06d6a0`
- **Purple Accent**: `#7209b7`
- **Gold Accent**: `#ffd600`

### Neutral Colors

- **Light Background**: `#f8fafc`
- **Dark Text**: `#1e293b`
- **White**: `#ffffff`
- **Black**: `#0f172a`
- **Grays**: `#f1f5f9`, `#e2e8f0`, `#cbd5e1`, `#475569`, `#334155`

## Typography

### Fonts

- **Headings**: Poppins (700-800 weight)
- **Body**: Inter (400-600 weight)
- **Alternative**: Rubik

### Font Sizes

- **H1**: 28-36px (Dashboard titles)
- **H2**: 24-28px (Section headers)
- **H3**: 20-22px (Card titles)
- **Body**: 15px (Main content)
- **Small**: 13-14px (Meta information)

## Gradients

### Primary Gradient

```css
linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)
```

### Sunset Gradient

```css
linear-gradient(135deg, #fb7185 0%, #fbbf24 100%)
```

### Ocean Gradient

```css
linear-gradient(135deg, #14b8a6 0%, #2563eb 100%)
```

### Neon Gradient

```css
linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)
```

### Success Gradient

```css
linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)
```

## Spacing

- **Small**: 0.5-1rem (8-16px)
- **Medium**: 1.5-2rem (24-32px)
- **Large**: 2.5-3rem (40-48px)

## Border Radius

- **Small**: 8px (`.radius-sm`)
- **Medium**: 12px (`.radius-md`)
- **Large**: 16px (`.radius-lg`)
- **Extra Large**: 24px (`.radius-xl`)
- **Full**: 9999px (`.radius-full`)

## Shadows

### Standard Shadows

- **Small**: Subtle depth for cards
- **Medium**: Default card hover state
- **Large**: Modals and elevated elements
- **Extra Large**: High-priority overlays

### Glow Shadows

- **Blue Glow**: Primary buttons and badges
- **Pink Glow**: Secondary accent elements
- **Teal Glow**: Success states

## Components

### Buttons

- Gradient backgrounds
- Ripple effect on click
- 2px elevation on hover
- Rounded corners (12-16px)

### Cards

- White/dark background
- Top border gradient accent
- Hover: Translate up 4-8px
- Border radius: 16px

### Badges

- Pill-shaped (border-radius: 9999px)
- Gradient backgrounds
- Subtle glow effect
- Font weight: 600

### Forms

- 2px border (gray-200)
- Focus: Blue border + glow
- Border radius: 12px
- Padding: 0.875rem 1rem

### Modals

- Backdrop blur: 8px
- Border radius: 24px
- Bounce animation on open
- Close button rotates on hover

## Animations

### Fade In

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### Slide Up Bounce

```css
@keyframes slideUpBounce {
  from {
    transform: translateY(100px) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
```

### Pulse (for urgent items)

```css
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
```

## Best Practices

1. **Use gradients** for primary CTAs and important elements
2. **Add emojis** for visual interest and personality
3. **Animate everything** - hover states, page transitions, modals
4. **Generous spacing** - use padding/margins liberally
5. **Consistent shadows** - create depth hierarchy
6. **Vibrant but professional** - balance energy with usability
7. **Dark mode support** - all colors should work in both modes

## Status Colors

### Task Status

- **Pending**: Sunset gradient (coral → gold)
- **In Progress**: Ocean gradient (teal → blue)
- **Completed**: Success gradient (green → teal)
- **Overdue**: Red gradient with pulse animation

### Priority Levels

- **Low**: Ocean gradient
- **Medium**: Sunset gradient
- **High**: Pink gradient
- **Critical**: Red gradient with pulse animation

## Responsive Breakpoints

- **Mobile**: max-width 768px
- **Tablet**: 769px - 1024px
- **Desktop**: 1025px+

## Accessibility

- Minimum contrast ratio: 4.5:1
- Focus states: Visible outline/glow
- Keyboard navigation: Full support
- Screen reader: Semantic HTML

---

**Design Philosophy**: Create an energetic, student-friendly interface that's both visually striking and highly functional. Use vibrant colors, smooth animations, and modern typography to make fest management feel exciting and approachable.
