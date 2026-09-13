# Outfit styling references

Colour choices now use the user-supplied seasonal chart, transcribed as approximate screen colours in `public/seasonal-palettes.js`:

- Spring: light, clear, warm.
- Summer: light, soft, cool.
- Autumn: deep, soft, warm.
- Winter: deep, clear, cool.

Users can select a palette or let the stylist choose one around their confirmed garment. The original garment is never recoloured. Suggestions use the closest harmonious catalogue colours and grounding neutrals. This is a clothing colour preference, not skin-tone or personal-season analysis.

Stockholm quiet tailoring and Copenhagen playful styling remain silhouette directions. Gender is optional and user-supplied (Woman, Man, Non-binary, Prefer not to say); it guides garment selection and generated garment cuts. Gender is never inferred from an image. All colours remain available to every gender. This preference is kept only in the temporary styling session; generated garment attributes and images may be cached without an account identity.

The recommendation request accepts optional `style`, `season` and `gender` fields. Outfit responses include a seasonal palette ID, colour notes and a styling tip. The book reference has been retired.

The 3D feature and its generation routes have been removed. Suggested garment images and the 2D outfit preview remain.
