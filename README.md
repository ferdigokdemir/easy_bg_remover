# Easy BG Remover

AI destekli arka plan kaldırma uygulaması. Electron.js ve [@imgly/background-removal-node](https://www.npmjs.com/package/@imgly/background-removal-node) paketi kullanılarak geliştirilmiştir.

![Easy BG Remover](https://img.shields.io/badge/Electron-28.0.0-47848F?style=for-the-badge&logo=electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)

## ✨ Özellikler

- 📷 Görsel seçme (JPG, PNG, WebP)
- 🪄 AI destekli arka plan kaldırma
- 👀 Orijinal ve işlenmiş görselleri yan yana önizleme
- 💾 İşlenmiş görseli PNG olarak kaydetme
- 📊 İşlem ilerleme durumu gösterimi

## 🚀 Kurulum

### Gereksinimler

- Node.js 18 veya üzeri
- npm veya yarn

### Adımlar

1. Depoyu klonlayın veya indirin:
```bash
git clone <repo-url>
cd easy_bg_remover
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Uygulamayı başlatın:
```bash
npm start
```

## 📖 Kullanım

1. **Görsel Seç** butonuna tıklayın veya sol panele tıklayarak bir görsel seçin
2. **Arka Planı Kaldır** butonuna tıklayın
3. İşlem tamamlandığında sonucu sağ panelde görün
4. **Kaydet** butonuyla işlenmiş görseli PNG olarak kaydedin

## 🛠️ Geliştirme

### Proje Yapısı

```
easy_bg_remover/
├── src/
│   ├── main.js          # Electron ana süreci
│   ├── preload.js       # IPC için preload script
│   ├── renderer.js      # Renderer süreci mantığı
│   ├── index.html       # Ana UI
│   └── styles.css       # Uygulama stilleri
├── package.json
└── README.md
```

### Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm start` | Uygulamayı geliştirme modunda başlatır |
| `npm run build` | Üretim için derleme yapar |

## 📦 Derleme

Üretim için derleme yapmak için:

```bash
npm run build
```

Bu komut, işletim sisteminize uygun bir yürütülebilir dosya oluşturacaktır.

## 🔧 Teknolojiler

- **[Electron.js](https://www.electronjs.org/)** - Masaüstü uygulama çerçevesi
- **[@imgly/background-removal-node](https://www.npmjs.com/package/@imgly/background-removal-node)** - AI destekli arka plan kaldırma
- **Node.js** - Backend runtime

## ⚠️ Notlar

- İlk kullanımda AI modeli indirilecektir (yaklaşık 100MB)
- Büyük görsellerin işlenmesi daha uzun sürebilir
- İşlenen görseller şeffaf arka planlı PNG formatında kaydedilir

## 📄 Lisans

MIT License
