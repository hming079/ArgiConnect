import dragonFruitImage from "@/assets/p-dragonfruit.jpg";
import durianImage from "@/assets/p-durian.jpg";
import jackfruitImage from "@/assets/p-jackfruit.jpg";
import mangoImage from "@/assets/p-mango.jpg";
import vegetablesImage from "@/assets/p-vegetables.jpg";
import watermelonImage from "@/assets/p-watermelon.jpg";

const cropImages: Record<string, string> = {
  "dua hau": watermelonImage,
  "thanh long": dragonFruitImage,
  xoai: mangoImage,
  mit: jackfruitImage,
  "sau rieng": durianImage,
  "bap cai": vegetablesImage,
  "rau cai": vegetablesImage,
  rau: vegetablesImage,
};

function normalizeCropName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .trim();
}

export function getCropImage(name: string) {
  const normalizedName = normalizeCropName(name);
  const matchedType = Object.keys(cropImages).find((type) => normalizedName.includes(type));
  return matchedType ? cropImages[matchedType] : undefined;
}
