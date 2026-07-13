# 🎨 signArt - Sanatsal Özgünlük Tescil Arayüzü & Baskı Stüdyosu

**signArt**, sanatçıların ürettikleri özgün eserleri (tablo, heykel, dijital sanat vb.) dijital olarak tescil etmelerini, benzersiz sertifika numaraları üretmelerini ve bu tescil belgelerini farklı kâğıt boyutlarında (A4, A5, A6, Kare) fiziksel baskıya hazır hale getirmelerini sağlayan şık, minimal ve premium bir Single Page Application (SPA) arayüzüdür.

---

## ✨ Öne Çıkan Özellikler

### 🔮 1. İnteraktif Tasarım Stüdyosu (Live Preview)
* **Reaktif Canlı Ön İzleme:** Form alanlarına veri girildikçe (Eser Adı, Boyut, Malzeme vb.) sağ taraftaki sertifika şablonu anlık olarak güncellenir.
* **Açılır-Kapanır Şablon Çekmecesi:** Şablon paneli yer kaplamaması için çekmece yapısındadır. Şablon seçildikten sonra otomatik olarak kapanır ve aktif tasarımı özet gösterge kartında gösterir.

### 🎨 2. Premium Tasarım Temaları & Buzlu Cam Efekti
* **Klasik Altın & Krem:** Geleneksel sanat galerisi hissi uyandıran krem dokusu ve altın çerçeve çizgileri.
* **Modern Koyu Tema:** Koyu mavi/indigo zemin, gümüş kenarlıklar ve mor neon vurgular.
* **Asil Parşömen:** Eskitilmiş rustik kâğıt dokusu, dikişli kenarlıklar ve kahverengi tonları.
* **Görsel Arka Plan Şablonları:** Sanatçının kendi eserlerini veya özel galeri temalarını sertifika arka planına yerleştirme seçeneği (Tasarım 1 - Tasarım 6).
* **Soluk Yazı Alanı Kontrastı:** Arka plan resmi seçildiğinde, yazının arkasında kalan bölgeye `%74` opaklıkta sıcak krem renginde buzlu cam katmanı (`backdrop-filter: blur(14px)`) eklenerek yazı okunabilirliği maksimumda tutulurken, resmin kenarları keskin ve orijinal kalır.

### 📐 3. Duyarlı Belge Boyutlandırma & Taşma Koruması
* **A4, A5, A6 ve Kare** formatlarında en-boy oranları (`1.414 / 1` ve `1 / 1`) kusursuz simüle edilir.
* Kompakt boyutlarda (özellikle A5 ve A6) iç boşluklar, font boyutları ve ara çizgiler otomatik olarak küçülerek yazıların kart dışına taşmasını engeller.
* Çevreleyici yapay siyah kutular kaldırılarak sertifika ekranda serbestçe ortalanmıştır.

### 🖨️ 4. Gelişmiş Baskı ve PDF Kaydetme Motoru
* Özel yazıcı medya sorgusu (`@media print`) sayesinde, tescil sayfasındaki menüler, butonlar ve arka planlar gizlenir.
* Sadece sertifika kâğıt sınırlarına tam yayılacak şekilde landscape (yatay) konumda baskıya veya PDF kaydetmeye aktarılır.

---

## 🛠️ Teknolojiler

* **Temel Yapı:** HTML5 (Semantik Tagler), JavaScript (ES6+ Vanilla)
* **Tasarım:** Vanilla CSS (Glassmorphism & Custom keyframe animations)
* **İkonlar:** Lucide Icons

---

## 🚀 Kurulum ve Çalıştırma

1. Bu depoyu bilgisayarınıza klonlayın veya zip olarak indirin:
   ```bash
   git clone https://github.com/Selvinur/signart.git
   ```
2. Proje klasöründeki `index.html` dosyasını tarayıcınızda çift tıklayarak açın.
3. Veya VS Code üzerinden **Live Server** eklentisiyle yerel sunucuda (`http://127.0.0.1:5500`) çalıştırın.

### 🔑 Test Giriş Bilgileri
* **E-Posta:** `test@signart.com`
* **Şifre:** `123456`
