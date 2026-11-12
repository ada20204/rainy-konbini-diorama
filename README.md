# 雨夜日式便利店街角 · 微缩景观

一个 three.js（v0.187 + Vite）微缩三维场景：**雨夜的日式便利店街角**，
三渲二（cel-shading）画风，像一件可自由把玩的收藏级小模型。

- **视角**：第三视角环绕观察，鼠标拖拽旋转 / 滚轮缩放 / 右键拖拽平移，无任何 UI
- **入场动画**：进入页面后模型自动从地面开始分层组装（底座→路面→建筑→店内→街具→电线→雨，约 11s）
- **雨夜氛围**：动态雨丝、地面溅落涟漪、积水霓虹倒影、招牌微闪、暖冷光对比

## 运行

```bash
npm install
npm run dev       # 开发模式，默认 http://localhost:5173
npm run build     # 产物输出到 dist/
npm run preview   # 预览构建产物（默认端口 4173）
```

## 部署 / 预览分享（tailscale serve）

适合在 tailnet 内网把场景挂到子路径下分享预览（不影响同机其他服务）：

```bash
npm run build
npx vite preview --port 4173 --host 127.0.0.1        # 1. 本地静态服务（可换任意静态服务器）
tailscale serve --bg --set-path /konbini http://127.0.0.1:4173   # 2. 挂到子路径
tailscale serve status                                # 3. 查看入口，形如 https://<节点>.<tailnet>.ts.net/konbini/
```

**特殊说明（踩过的坑）：**

1. **子路径挂载不覆盖已有服务**：`--set-path /xxx` 只新增/替换该挂载点，根路径 `/` 上已有的服务不受影响；卸载也只针对该挂载点：
   `tailscale serve --bg --set-path /xxx off`。
   ⚠️ 不要用 `tailscale serve reset`——它会清掉整台节点的全部 serve 配置（包括别人挂的根路径服务）。
2. **相对 base**：`vite.config.js` 中 `base: './'`，构建产物才能在任意子路径下正确加载资源（否则页面能开但 JS/CSS 404 → 黑屏）。
3. **放行 MagicDNS 域名**：Vite dev/preview 默认拒绝自定义 Host 头，需在 `vite.config.js` 的 `server`/`preview` 里设置
   `allowedHosts: ['.ts.net']`，否则报 `Blocked request. This host ... is not allowed`。
4. **serve = tailnet 内网**，只有登录在同一 tailnet 的设备能访问；要公开到互联网需另用 `tailscale funnel`（谨慎）。
5. **代理干扰**：本机 shell 的 `http(s)_proxy` 会劫持 tailnet 域名的请求，curl 自测时加 `--noproxy '*'`；浏览器若挂系统代理同理。
6. **区分挂载点**：同域名下可能同时挂了多个项目，确认地址栏路径正确（黑屏先看是不是开错挂载点）。

## 场景内容

正方形底座上的街角 L 形路网（前街 × 右街 + 十字路口），便利店位于视觉中心：

| 类别 | 元素 |
| --- | --- |
| 店铺 | 发光招牌（虚构品牌 KOMOREBI 24）、竖式悬挂招牌、OPEN 灯箱、条纹雨棚、大面积玻璃橱窗、自动门、门垫、护柱、空调外机、落水管、电表箱 |
| 店内 | 双排货架（商品实例化）、后墙玻璃冷柜（饮料）、收银台 + 收银机 + 咖啡机 + 热食柜、悬挂菜单、杂志架、天花板灯盘、暖色照明、海报、购物篮 |
| 街具 | 自动贩卖机 ×2、自行车、雨伞架、垃圾桶、电线杆 ×2 + 悬垂电线、路灯、路牌（行人/禁停）、街角护栏、消防栓、公告栏、井盖、排水沟格栅、停车位、反光斑马线、积水 |
| 环境 | 左侧邻楼（小巷、管道、巷灯、霓虹灯条）、屋顶空调、行道树、雨丝 + 溅落涟漪、湿路灯光倒影 |

## 代码结构

```
vite.config.js         相对 base + allowedHosts（子路径/内网域名部署用）
src/
  main.js              入口：渲染器 / 相机 / OrbitControls / 装配时间轴
  core/
    toon.js            toon 渐变贴图、材质工厂、反向壳描边
    textures.js        Canvas 程序化贴图（招牌/海报/路面/贩卖机/玻璃…）
    lights.js          夜景灯光（冷月光 + 环境）
    rain.js            雨丝、溅落涟漪
    assembly.js        模型分层组装入场动画
  scene/
    layout.js          布局常量（各模块共用坐标）
    base.js            底座、路网、标线、排水沟、积水、光晕贴花
    store.js           便利店外壳 + 店内陈设
    props.js           全部街具（贩卖机/自行车/电线杆/护栏/邻楼…）
    buildScene.js      场景总装，登记装配部件
scripts/
  probe.mjs            无头浏览器冒烟测试（截图 + 控制台检查，`npm run shots`）
```

## 实现要点

- **三渲二**：`MeshToonMaterial` + 8 级阶梯渐变（前 4 级为 0，防止室内点光漏到屋顶背光面）
- **描边**：反向壳（inverted hull），沿合并平滑法线外扩，硬边物体角部不裂缝
- **贴图**：全部 Canvas 程序化生成，离线可用
- **性能**：商品/饮料用 InstancedMesh；雨丝用 LineSegments；仅月光投影

## 冒烟测试

```bash
npm run build && npm run preview &
npm run shots     # 截图输出到 shots/，同时检查控制台报错
```

页面加载失败时（WebGL 不可用、脚本报错等）左下角会出现红色诊断条，正常运行无任何 UI。
