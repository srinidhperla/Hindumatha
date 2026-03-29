import { toCloudinaryFetchUrl } from "@/utils/imageOptimization";

const heroSourceSlides = [
  {
    image: "https://hindumatha.me/images/gallery/cake1.jpg",
    alt: "Signature cake",
  },
  {
    image: "https://hindumatha.me/images/gallery/cake2.jpg",
    alt: "Chocolate cake",
  },
  {
    image: "https://hindumatha.me/images/gallery/cake3.jpg",
    alt: "Wedding cake",
  },
];

export const heroSlides = heroSourceSlides.map((slide) => ({
  ...slide,
  image: toCloudinaryFetchUrl(slide.image),
}));

export const typedWords = [
  "Birthday Cakes",
  "Wedding Tiers",
  "Chocolate Dreams",
  "Custom Creations",
  "Eggless Delights",
];

export const quickTags = [
  "Birthday",
  "Wedding",
  "Cupcakes",
  "Chocolate",
  "Photo Cakes",
  "Eggless",
];

const categorySourceItems = [
  {
    label: "Birthday",
    image: "https://hindumatha.me/images/gallery/cake2.jpg",
  },
  {
    label: "Wedding",
    image: "https://hindumatha.me/images/gallery/cake1.jpg",
  },
  {
    label: "Cupcakes",
    image: "https://hindumatha.me/images/gallery/cake8.jpg",
  },
  {
    label: "Chocolate",
    image: "https://hindumatha.me/images/gallery/cake3.jpg",
  },
  {
    label: "Pastries",
    image: "https://hindumatha.me/images/gallery/cake4.jpg",
  },
  {
    label: "Custom",
    image: "https://hindumatha.me/images/gallery/cake5.jpg",
  },
  {
    label: "Photo Cakes",
    image: "https://hindumatha.me/images/gallery/cake6.jpg",
  },
];

export const categoryStrip = categorySourceItems.map((item) => ({
  ...item,
  image: toCloudinaryFetchUrl(item.image),
}));
