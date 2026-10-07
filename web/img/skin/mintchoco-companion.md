# 薄荷可可猫耳伙伴立绘

- 素材：`mintchoco-companion.png`，992 × 1586，RGBA 透明背景。
- 来源：用户提供的猫耳角色图片；使用内置 imagegen 的 `background-extraction` 编辑。原图只用于角色提取，第二张键盘图只作为后续主题的颜色参考。
- 用途：AI 语伴「伙伴设置 → 形象」中的单视角全身立绘，聊天页显示与说话轻动；其他页面可选悬浮、拖动。主题由独立样式实现。
- 边界：这是保留角色特征的生成式抠图，不是原图像素级蒙版；脸部和细小蕾丝可能与原图略有差异。公开分发前应确认原画授权。

最终生成提示词：

> Use case: background-extraction. Produce a transparent PNG cutout of the exact cat-eared character already visible in the input photograph/illustration. This is a masking task, not a redraw: retain the original pixels, soft rendering, face, pose, brown hair, ears, white lace, pale aqua and cream dress, brown corset, gold ornaments, striped stockings, dark shoes, ribbons, tail and their precise colors. Remove the tan display room, wall, platform, floor, shadows and any background; transparent alpha everywhere outside the character. Keep the complete standing figure with small transparent margins. Smooth clean edge without colored fringing, speckles, halos, invented details, added objects, text or frame.
