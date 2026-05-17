#target photoshop
app.displayDialogs = DialogModes.NO;

var originalUnits = app.preferences.rulerUnits;
app.preferences.rulerUnits = Units.PIXELS;

var outDir = new Folder("C:/Users/nkmrk/Downloads/wrestle-manager/output/newspaper");
if (!outDir.exists) outDir.create();

var photoMain = new File("D:/comfyUI/ComfyUI_windows_portable/ComfyUI/output/米山VS東金 (8) のコピー.png");
var photoSub = new File("D:/comfyUI/ComfyUI_windows_portable/ComfyUI/output/米山VS東金 (3) のコピー 2.png");
var psdOut = new File("C:/Users/nkmrk/Downloads/wrestle-manager/output/newspaper/togane_vs_yoneyama_sports_newspaper_editable.psd");

var doc = app.documents.add(3508, 4961, 300, "地下リングスポーツ_東金VS米山_編集可能", NewDocumentMode.RGB, DocumentFill.WHITE);

function rgb(hex) {
    var c = new SolidColor();
    c.rgb.red = parseInt(hex.substring(0, 2), 16);
    c.rgb.green = parseInt(hex.substring(2, 4), 16);
    c.rgb.blue = parseInt(hex.substring(4, 6), 16);
    return c;
}

function rectLayer(name, x, y, w, h, hex) {
    var layer = doc.artLayers.add();
    layer.name = name;
    doc.selection.select([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
    doc.selection.fill(rgb(hex));
    doc.selection.deselect();
    return layer;
}

function textLayer(name, contents, x, y, size, hex, fontName) {
    var layer = doc.artLayers.add();
    layer.kind = LayerKind.TEXT;
    layer.name = name;
    var t = layer.textItem;
    t.contents = contents;
    t.position = [x, y];
    t.size = size;
    t.color = rgb(hex);
    try { t.font = fontName; } catch (e) {}
    return layer;
}

function pasteImage(name, file, x, y, w, h) {
    var src = app.open(file);
    src.selection.selectAll();
    src.selection.copy();
    src.close(SaveOptions.DONOTSAVECHANGES);
    app.activeDocument = doc;
    doc.paste();
    var layer = doc.activeLayer;
    layer.name = name;
    var b = layer.bounds;
    var bw = b[2].value - b[0].value;
    var bh = b[3].value - b[1].value;
    var scale = Math.max((w / bw) * 100, (h / bh) * 100);
    layer.resize(scale, scale, AnchorPosition.MIDDLECENTER);
    b = layer.bounds;
    var cx = (b[0].value + b[2].value) / 2;
    var cy = (b[1].value + b[3].value) / 2;
    layer.translate(x + w / 2 - cx, y + h / 2 - cy);
    return layer;
}

rectLayer("紙面背景", 0, 0, 3508, 4961, "f4eedb");
rectLayer("題字_黒帯", 210, 155, 3088, 260, "161616");
textLayer("題字_地下リングスポーツ", "地下リングスポーツ", 300, 320, 155, "ffffff", "YuGothic-Bold");
textLayer("右上_女子地下プロレス特報", "女子地下プロレス特報", 2630, 270, 48, "ffe02e", "YuGothic-Bold");
textLayer("右上_独占マッチリポート", "独占マッチリポート", 2675, 345, 42, "ffe02e", "YuGothic-Bold");

rectLayer("主見出し_赤帯", 210, 490, 3088, 370, "c40012");
textLayer("主見出し_東金、米山を完全制圧", "東金、米山を完全制圧", 300, 755, 205, "ffffff", "YuGothic-Bold");
textLayer("サブ見出し", "終始主導権を握った沙織が一方的な蹂躙劇を締める", 230, 985, 70, "161616", "YuGothic-Bold");

pasteImage("メイン写真_東金勝利場面", photoMain, 210, 1125, 3088, 1500);
rectLayer("メイン写真キャプション_黒帯", 210, 2625, 3088, 84, "000000");
textLayer("メイン写真キャプション", "勝利を確信した東金、リング中央で冷然", 250, 2685, 42, "ffffff", "YuGothic-Bold");

rectLayer("試合結果_黄帯", 210, 2795, 3088, 150, "ffe02e");
textLayer("試合結果テキスト", "東金沙織 ○    米山杏里 ●", 910, 2905, 100, "161616", "YuGothic-Bold");

pasteImage("サブ写真_攻防場面", photoSub, 210, 3130, 880, 1130);
rectLayer("サブ写真キャプション_黒帯", 210, 4260, 880, 80, "000000");
textLayer("サブ写真キャプション", "米山、反撃の糸口をつかめず", 250, 4315, 34, "ffffff", "YuGothic-Bold");

var body1 = "地下リングで行われた米山杏里対東金沙織の一戦は、開始直後から東金が圧力をかけ続ける展開となった。\r米山は序盤に腕を取り返そうと試みたが、東金は冷静に体勢を崩し、ロープ際でも中央でも主導権を渡さない。";
var body2 = "観客席のざわめきが大きくなる中、東金は一つひとつの攻めを確実につなぎ、米山の反撃を封じ込めた。\r終盤、消耗の色が濃くなった米山に対し、東金はなおもペースを落とさず、リング中央で勝負を決定づけた。試合後の東金は余裕を崩さず、圧倒的な勝利を印象づけた。";
textLayer("本文_1段目", body1, 1210, 3270, 44, "161616", "YuMincho-Regular");
textLayer("本文_2段目", body2, 2180, 3270, 44, "161616", "YuMincho-Regular");

rectLayer("注記_赤帯", 210, 4590, 3088, 90, "c40012");
textLayer("注記テキスト", "紙面データ: 写真・見出し・本文・結果欄を別要素として再構成", 260, 4655, 40, "ffffff", "YuGothic-Bold");

var opts = new PhotoshopSaveOptions();
opts.layers = true;
opts.alphaChannels = true;
doc.saveAs(psdOut, opts, true, Extension.LOWERCASE);
doc.close(SaveOptions.DONOTSAVECHANGES);
app.preferences.rulerUnits = originalUnits;
