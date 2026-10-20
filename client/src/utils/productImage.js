const produceImages = {
  tomato: '/images/produce/tomato.jpg',
  potato: '/images/produce/potato.jpg',
  onion: '/images/produce/red-onion.jpg',
  carrot: '/images/produce/carrot.jpg',
  cabbage: '/images/produce/cabbage.jpg',
  cauliflower: '/images/produce/cauliflower.jpg',
  brinjal: '/images/produce/brinjal.jpg',
  spinach: '/images/produce/spinach.jpg',
  cucumber: '/images/produce/cucumber.jpg',
  'green chilli': '/images/produce/green-chili.jpg',
  apple: '/images/produce/apple.jpg',
  banana: '/images/produce/banana.jpg',
  mango: '/images/produce/mango.jpg',
  orange: '/images/produce/orange.jpg',
  grapes: '/images/produce/grapes.jpg',
  watermelon: '/images/produce/watermelon.jpg',
  papaya: '/images/produce/papaya.jpg',
  pineapple: '/images/produce/pineapple.jpg',
  pomegranate: '/images/produce/pomegranate.jpg',
  guava: '/images/produce/guava.jpg',
  rice: '/images/produce/rice.jpg',
  wheat: '/images/produce/wheat.jpg',
  maize: '/images/produce/maize.jpg',
  millet: '/images/produce/millet.jpg',
  ragi: '/images/produce/ragi.jpg',
  lentils: '/images/produce/lentils.jpg',
  chickpeas: '/images/produce/chickpeas.jpg',
  'green gram': '/images/produce/green-gram.jpg',
  groundnuts: '/images/produce/groundnuts.jpg',
  milk: '/images/produce/milk.jpg',
  curd: '/images/produce/curd.jpg',
  paneer: '/images/produce/paneer.jpg',
  butter: '/images/produce/butter.jpg',
  ghee: '/images/produce/ghee.jpg',
  cheese: '/images/produce/cheese.jpg',
  buttermilk: '/images/produce/buttermilk.jpg',
  'country tomato': '/images/produce/tomato.jpg',
  'farm okra': '/images/produce/okra.jpg',
  drumstick: '/images/produce/drumstick.jpg',
  'red onion': '/images/produce/red-onion.jpg',
  'sweet corn': '/images/produce/sweet-corn.jpg',
  'ridge gourd': '/images/produce/ridge-gourd.jpg',
  'organic spinach': '/images/produce/spinach.jpg',
  garlic: '/images/produce/garlic.jpg'
};
const oldSeedImages = [
  'photo-1546094096-0df4bcaaa337',
  'photo-1566385101042-1a0aa0c1268c',
  'photo-1518977676601-b53f82aba655',
  'photo-1540420773420-3366772f4999'
];

export function productImage(product) {
  const image = product?.images?.[0] || '';
  const cropImage = produceImages[product?.name?.trim().toLowerCase()];
  const isOldSeedPhoto = oldSeedImages.some((photoId) => image.includes(photoId));
  const isProduceIllustration = image.startsWith('/images/produce/') && image.endsWith('.svg');
  if (isOldSeedPhoto || !image || (isProduceIllustration && cropImage)) return cropImage || '/images/produce/farm-produce.svg';
  return image || '/images/produce/farm-produce.svg';
}

export function fallbackProductImage(event, product) {
  const image = event.currentTarget;
  const mappedImage = produceImages[product?.name?.trim().toLowerCase()];
  const fallbackPath = mappedImage || '/images/produce/farm-produce.svg';
  const fallbackUrl = new URL(`${import.meta.env.BASE_URL}${fallbackPath.slice(1)}`, image.baseURI).href;
  const genericFallbackUrl = new URL(`${import.meta.env.BASE_URL}images/produce/farm-produce.svg`, image.baseURI).href;

  if (image.src !== fallbackUrl && image.dataset.productFallback !== 'used') {
    image.dataset.productFallback = 'used';
    image.src = fallbackUrl;
    return;
  }

  image.onerror = null;
  image.src = genericFallbackUrl;
}
