# VOIT design-system mapping

The product uses the VOIT Figma system as its visual and interaction foundation.
Application layouts remain specific to the scholarship and admissions workflow.

## Connected foundations

- `Theme`: semantic light/dark colors, borders, labels, focus, and feedback states.
- `Spacing`: 4px-based spacing, stroke widths, and corner radii.
- `Typography`: Urbanist semantic type ramp from Note through Display 1.
- `Responsive`: 1232px desktop, 834px tablet, and 390px mobile reference widths.
- `Effects`: VOIT shadow hierarchy and background-blur behavior.

## Component mappings in Sprint 1

| Product primitive | VOIT source |
| --- | --- |
| Primary action | Primary Button / Fill / XLarge / Default |
| Quiet action | Primary Button / Subtle |
| Text and number input | Text field / White / Medium |
| Single and multi-choice control | Radio Base / Accent / Medium-20 |
| Assessment completion | Progress Bar / Medium-8 |
| Report sections | Card Header + Card Footer foundations |
| Status labels | Badge and semantic Theme variables |

The code uses semantic variables rather than copying a Figma screen layer. This
keeps the assessment engine independent from presentation and lets later web and
iOS clients share the same VOIT naming and intent.

