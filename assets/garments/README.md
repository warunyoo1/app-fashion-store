# โมเดลเสื้อผ้าสำหรับ RACK

คัดเลือกและดาวน์โหลดเมื่อ 29 ตุลาคม 2026 เก็บไฟล์จริงไว้ใน repo แล้ว เปิดทดสอบด้วย Three.js `GLTFLoader` รุ่นที่โปรเจกต์ใช้อยู่ได้ครบทั้ง 3 ชุดหลัก รวมถึงสีและพื้นผิวที่ฝังใน GLB

หน้าเว็บหลักใช้ Studio Tee ของ plaggy และเสื้อทั้ง 4 ตัวจาก Clothes ของ Naira แล้ว รวมเป็น 5 แบบบนราว คอลเลกชัน มุมดูใกล้ และพรีวิวเมนู ไฟล์ที่แยกและจัดจุดแขวนอยู่ใน `public/assets/models/` ส่วน dudecon ยังเป็นชุดสำรอง

| ชุด | ไฟล์ | ขนาดจริง | สามเหลี่ยม | เหมาะกับ |
| --- | --- | ---: | ---: | --- |
| [CC0 - Shirt On Hanger — plaggy](https://sketchfab.com/3d-models/cc0-shirt-on-hanger-846d8f285fcb426498033ae67aee2d10) | `plaggy-pbr-shirt/source.glb` | 8.18 MB | 2,329 | **แนะนำเริ่มจากตัวนี้** เสื้อยืดพร้อมไม้แขวน มีพื้นผิวผ้าและ normal map สำหรับรายละเอียดรอยพับ |
| [Hangers and Long Sleeve Shirt — dudecon](https://sketchfab.com/3d-models/hangers-and-long-sleeve-shirt-14cc81980a06473a820f811596418fae) | `dudecon-longsleeve/source.glb` | 0.44 MB | 3,676 | เสื้อแขนยาวและไม้แขวนหลายแบบ ไฟล์เบา เหมาะทดลองกับราว |
| [Clothes — Naira](https://sketchfab.com/3d-models/clothes-54646263f96a47be9b3d2befe8d0555e) | `naira-clothes/source.glb` | 18.82 MB | 93,087 ทั้งชุด | ฮู้ดดี้ เสื้อยืดกราฟิก แจ็กเก็ตหนัง และเสื้อเชิ้ตบนไม้แขวน สำหรับเพิ่มความหลากหลาย |

ขนาดข้างต้นใช้ MB ฐานสิบจากไฟล์ที่ดาวน์โหลด ไม่ใช่ขนาด gzip หรือขนาด GPU หลังคลายภาพ

## ตัวอย่างจากไฟล์จริง

![เสื้อยืด PBR ของ plaggy](previews/pbr-shirt.png)

![เสื้อแขนยาวของ dudecon](previews/long-sleeve.png)

![ชุดเสื้อผ้าของ Naira](previews/clothes-collection.png)

ภาพข้างต้นเรนเดอร์จาก GLB ที่ดาวน์โหลดด้วย Three.js ใน repo นี้ เครดิตของแต่ละภาพเป็นของผู้สร้างโมเดลตามหัวข้อและตาราง

## เครดิตและสิทธิ์

หน้าดาวน์โหลด Sketchfab ของทั้ง 3 ชุดระบุ **CC Attribution / CC BY 4.0** และอนุญาตการใช้งานเชิงพาณิชย์โดยให้เครดิตผู้สร้าง จึงเก็บข้อความเครดิตใน `CREDITS.txt` ของแต่ละโฟลเดอร์แล้ว เมื่อแสดงบนเว็บให้เชื่อมเครดิตนี้กับส่วนข้อมูล/เครดิตทรัพยากรที่ผู้ใช้เข้าถึงได้ พร้อมระบุหากมีการแก้โมเดลหรือพื้นผิว

ชื่อและคำอธิบายของเสื้อยืด plaggy กล่าวถึง CC0 และคำอธิบายของ dudecon กล่าวถึง public domain แต่หน้าดาวน์โหลดแสดง CC BY 4.0 ชุดที่ดาวน์โหลดจาก Sketchfab นี้จึงเก็บเครดิตตามเงื่อนไข CC BY 4.0 ไว้ครบ

- สิทธิ์: https://creativecommons.org/licenses/by/4.0/
- ไฟล์ `source.glb` ทั้ง 3 ชุดเก็บตรงตามที่ดาวน์โหลด ไม่ได้แก้รูปทรง พื้นผิว หรือข้อมูลต้นฉบับ
- ไม่มีการสมัครบริการเสียเงินหรือซื้อโมเดลในการดาวน์โหลดชุดนี้

## กระบวนการจัดลงราว

1. เริ่มจากเสื้อยืด PBR แยก mesh ของเสื้อกับไม้แขวนได้แล้วในไฟล์ (`ShirtOnHanger_Shirt_0`, `ShirtOnHanger_Hanger_0`) ตรวจจุดยึด hook และขนาดให้เข้ากับราวเดิม
2. ปรับสี/ลายเดิมให้เข้ากับ RACK พร้อมบันทึกว่าแก้ไขอะไร เสื้อยืด PBR มีลาย CHEESE ส่วนแขนยาวมีลายสาธิตของผู้สร้างอยู่
3. เลือกไม้แขวนเพียงแบบที่ต้องการจากชุด dudecon และแยกเสื้อทั้ง 4 แบบของ Naira เป็นทรัพยากรสินค้ารายชิ้นก่อนใช้งาน
4. ลด/บีบอัดพื้นผิวและประเมินหน่วยความจำก่อนโหลดหลายตัวพร้อมกัน โดยเฉพาะชุด Naira ที่มีภาพฝัง 27 ภาพ ตัวเลือก 1K ยังมีไฟล์ 18.82 MB
5. ทดสอบการเลือก หมุน เลื่อน การค้างของตำแหน่งไม้แขวน การชนกันระหว่างเสื้อ และจอเล็กในเว็บหลักหลังเชื่อมจริง โมเดลเหล่านี้ยังไม่มีระบบผ้าพริ้วหรือ cloth simulation

## ไฟล์สำรองเบา

`plaggy-tshirt/plaggy-tshirt.glb` เป็นเสื้อยืดพร้อมไม้แขวนอีกรุ่นจาก [OpenGameArt โดย plaggy](https://opengameart.org/content/t-shirt-and-hanger) หน้าแหล่งที่มาระบุ CC0 ตัวนี้มี 2,048 สามเหลี่ยม ขนาด 231,176 ไบต์ เหมาะเป็นตัวเปรียบเทียบด้านความเบา แต่รายละเอียดทรงน้อยกว่าตัว PBR เก็บ ZIP, OBJ, DAE และภาพต้นฉบับไว้ในโฟลเดอร์เดียวกัน

การแปลงไฟล์สำรองใช้ `node scripts/prepare-plaggy-shirt.mjs` โดยคง UV atlas เดิม แก้ทิศ UV ให้ตรงกับ glTF แยกวัสดุผ้า/ไม้/โลหะ รวมการวาดเหลือ 3 กลุ่ม และปรับความสูงรวมเป็น 1 เมตร โดยจุดสูงสุดของตะขออยู่ที่ Y=0 จุดสัมผัสราวจริงต้องตรวจอีกครั้งเมื่อเชื่อมกับราว

## การตรวจไฟล์

- `catalog.json`: แหล่งที่มา เครดิต บทบาท ขนาด checksum และรายละเอียด mesh ของชุดหลัก
- `model-info.json`: ข้อมูลของแต่ละชุด
- `node scripts/inspect-garment-assets.mjs`: ตรวจโครงสร้าง GLB 2, ช่วง buffer view และภาพ/ข้อมูลที่ฝังในไฟล์ แล้วสร้างรายการ metadata ใหม่
- เปิดดูด้วย Three.js และหมุนโมเดลด้วยปุ่มในหน้าทดสอบ `.qa/garment-review.html` แล้ว ไม่มีการเรียกทรัพยากรภายนอกจาก GLB และไม่มี decoder เพิ่มเติมที่จำเป็น
- หน้าทดสอบและหลักฐานดิบใน `.qa/` เป็นเครื่องมือตรวจภายใน ไม่ได้รวมในหน้าเว็บหลัก การตรวจนี้ยังไม่ใช่การรับรองโดย Khronos glTF Validator หรือการทดสอบการใช้งานจริงบนราว

## การเชื่อม Clothes ที่เสร็จแล้ว

`node scripts/prepare-naira-clothes.mjs` แยก Clothes เป็น Cassette Hoodie, Graphic Tee, Leather Jacket และ Crimson Check Shirt คงสามเหลี่ยมครบ 93,087 และภาพ PBR เดิมครบ 27 ภาพ แยกเฉพาะข้อมูลของแต่ละตัวและจัด hardware ให้ตรงสินค้า ไม่สร้างภาพหรือรูปทรงเสื้อใหม่ ข้อมูลขนาดและ mesh ต้นทางอยู่ใน `naira-clothes/rail-models.json` รูปย่อ `original.png` เรนเดอร์จาก GLB ตัวเดียวกับหน้าเว็บ ไฟล์ GLB เก็บไม้แขวนต้นฉบับไว้ แต่ตอนแสดงผลซ่อนไม้แขวนเดิม แล้วใช้โมเดลไม้จาก Studio Tee แบบเดียวกันทั้ง 5 ตัว โดยปรับความกว้างและระดับไหล่ให้พอดีคอเสื้อ จุดตะขอยังคงอยู่บนราว ภาพและโมเดลต้นทางยังคงเครดิต Naira ตาม CC BY 4.0

## Relaxed Tee และไม้แขวนแยกไฟล์

หน้าเว็บเปลี่ยนเสื้อ CHEESE เป็น T Shirt ของ funlab117 แล้ว ชื่อตัวอย่างในแค็ตตาล็อกคือ Relaxed Tee ไฟล์ต้นฉบับอยู่ใน `funlab-tee/source.glb` และไฟล์ลดความละเอียดพร้อม metadata อยู่ใน `public/assets/models/relaxed-tee/` และ `funlab-tee/rail-model-info.json` ไม้แขวนเดิมถูกแยกไว้ใน `public/assets/models/shared-hanger/` โดยไม่โหลดตัวเสื้อ CHEESE พื้นผิวไม้เดิมยังคงครบ ส่วนเสื้อใหม่ใช้สีวัสดุ Chalk และ Ink ตาม geometry ที่นำเข้าจริง

## คอลเลกชันเพิ่ม 7 แบบ

เพิ่มโมเดลจริงจาก Style3D CG และ Obridje เป็น 12 แบบบนราวเลื่อนได้ รายการแหล่งดาวน์โหลดอยู่ใน `curated-models.json` และรายละเอียดไฟล์ที่ลดความละเอียดอยู่ใน `curated-rail-models.json` ภาพ `original.jpg` ของชุดใหม่เรนเดอร์จาก GLB และไม้แขวนชุดเดียวกับเว็บ ไม่มีการเติมจำนวนด้วยการวางเสื้อตัวเดียวซ้ำหลายช่อง

- [Western Shirt — Style3D CG](https://sketchfab.com/3d-models/cowboy-shirt-a3da546b27a34eb0a95adeb2f5921551): 183,858 → 30,992 สามเหลี่ยม, 2.05 MB, CC BY 4.0

- [Utility Jacket — Style3D CG](https://sketchfab.com/3d-models/black-jacket-coat-2181e25803164fd690c0debb4d4f391a): 171,830 → 44,496 สามเหลี่ยม, 4.30 MB, CC BY 4.0

- [Rose Leather Jacket — Style3D CG](https://sketchfab.com/3d-models/pink-short-leather-jacket-e45bdd7dc2c84be9a0a215150052d23a): 84,284 → 25,280 สามเหลี่ยม, 2.21 MB, CC BY 4.0

- [Khaki Overshirt — Style3D CG](https://sketchfab.com/3d-models/khaki-woven-symmetrical-loose-jacket-491211137ebc4a21b014e1b3cddc455d): 288,102 → 67,802 สามเหลี่ยม, 4.20 MB, CC BY 4.0

- [Urban Hoodie — Obridje](https://sketchfab.com/3d-models/hoodie-ab78848ab3404a2e877929d5f8774c54): 148,426 → 30,150 สามเหลี่ยม, 1.10 MB, CC BY 4.0

- [Studio Graphic Tee — Obridje](https://sketchfab.com/3d-models/t-shirt-76240162dcd747d4bb4ca3658b463b0a): 97,244 → 29,168 สามเหลี่ยม, 1.00 MB, CC BY 4.0

- [Rose Hoodie — Style3D CG](https://sketchfab.com/3d-models/pink-drawstring-hooded-sweatshirt-fd03f442026f4252b2507dda53bba564): 109,770 → 34,022 สามเหลี่ยม, 1.95 MB, CC BY 4.0
