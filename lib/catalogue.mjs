import { catalogue as originalCatalogue } from '../data/catalogue.mjs';
// Original garment concepts for the styling edit. No retailer or ownership claims.
const pieces = [
 ['espresso-trousers','bottom','espresso','Espresso pleated relaxed trousers','wide','#44362F','trousers','wool-blend suiting','relaxed wide-leg','full length','single front pleat, clean waistband, fluid drape'],
 ['stone-trousers','bottom','stone','Stone wide-leg cotton trousers','wide','#C9C2B2','trousers','cotton twill','wide-leg','full length','flat front, clean waistband, soft structured drape'],
 ['butter-trousers','bottom','butter yellow','Butter-yellow straight trousers','straight','#E8D89D','trousers','cotton twill','straight-leg','ankle length','flat front, uncluttered waistband'],
 ['ink-trousers','bottom','ink','Ink wide-leg tailored trousers','wide','#263852','trousers','wool-blend suiting','wide-leg','full length','pressed front crease, simple waistband'],
 ['ecru-jeans','bottom','ecru','Ecru straight-leg jeans','straight','#E9E2D2','jeans','denim','straight-leg','full length','five pockets, tonal stitching, no distressing'],
 ['chocolate-skirt','bottom','chocolate','Chocolate satin midi skirt','skirt','#554038','skirt','matte satin','soft A-line','midi','clean bias-inspired drape, simple waistband'],
 ['butter-knit','top','butter yellow','Butter-yellow fine-knit short-sleeve top','tee','#E8D89D','knit top','fine cotton knit','regular','hip length','crew neckline, short sleeves, fine ribbed edges'],
 ['chocolate-knit','top','chocolate','Chocolate relaxed fine-knit top','tee','#554038','knit top','fine merino knit','relaxed','hip length','crew neckline, long sleeves, fine ribbed cuffs'],
 ['powder-shirt','top','powder blue','Powder-blue oversized poplin shirt','shirt','#A8C3D0','shirt','cotton poplin','relaxed oversized','hip length','point collar, button front, long sleeves, curved hem'],
 ['rose-shirt','top','dusty rose','Dusty-rose relaxed poplin shirt','shirt','#CBABB0','shirt','cotton poplin','relaxed','hip length','point collar, button front, long sleeves'],
 ['navy-stripe-shirt','top','white and navy','White poplin shirt with fine navy stripes','shirt','#F4F2ED','shirt','cotton poplin','relaxed','hip length','fine vertical navy stripes, point collar, long sleeves'],
 ['sage-shirt','top','sage','Sage boxy short-sleeve shirt','shirt','#A6AD91','shirt','cotton linen','relaxed boxy','hip length','open point collar, button front, short sleeves']
];
export const stylingCatalogue = pieces.map(([id,category,colour,description,shape,fill,garment_type,material,silhouette,length,details]) => ({
 id,category,colour,description,shape,fill,colour_hex:fill,pattern:id==='navy-stripe-shirt'?'striped':'solid',
 design:{garment_type,material,silhouette,length,details},
 image_ref:'/catalogue/'+id+'.svg', image_type:'illustration', source_name:'heyTwin (original illustration)'
}));
export const catalogue = [...originalCatalogue, ...stylingCatalogue.filter(item => !originalCatalogue.some(original => original.id === item.id))];
