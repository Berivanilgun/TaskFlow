# TASKFLOW — Görev ve Proje Yönetim Sistemi API

Bir yazılım ekibinin görev oluşturmasını, çalışan atamasını, görevleri görüntülemesini, güncellemesini ve silmesini sağlayan REST API. Node.js, Express.js ve JavaScript CommonJS kullanır; veriler JSON dosyasında kalıcı saklanır.

**Doğrulama:** 10 otomatik test başarılı, 0 başarısız; 114 gerçek HTTP isteği. Postman Collection Runner: **27 başarılı, 0 başarısız**. CRUD, hata senaryoları ve yeniden başlatmada veri kalıcılığı kontrol edildi.

**Teknolojiler:** Node.js 22+, Express 5, JavaScript CommonJS, npm, JSON dosya saklama ve Node.js yerleşik test araçları.

## Kurulum

Node.js 22 veya üzeri ve npm gerekir. Kontroller Windows üzerinde Node.js 24.18.0 ve Express 5.3.0 ile çalıştırıldı. VS Code'da TaskFlow klasörünü aç; terminal package.json'ın bulunduğu proje kökünde olsun.

~~~powershell
node --version
npm --version
npm ci
~~~

npm ci, package-lock.json'daki sürümleri kurar. Tek doğrudan harici bağımlılık Express'tir; onun alt bağımlılıkları da npm tarafından kurulur. node_modules teslimde veya GitHub'da kaynak dosya olarak tutulmaz.

## Çalıştırma ve npm komutları

~~~powershell
npm start
~~~

API http://localhost:3000 adresinde başlar. Ctrl+C ile durdur. Geliştirirken dosya değişiminde yeniden başlatmak için npm run dev kullan.

| Komut | İşlev |
| --- | --- |
| npm ci | Kilit dosyasından temiz ve tekrarlanabilir kurulum |
| npm start | API sunucusunu başlatma |
| npm run dev | Node.js watch ile geliştirme |
| npm test | Yerleşik Node.js otomatik testleri |
| npm ls --depth=0 | Doğrudan bağımlılıkları listeleme |

Başka port için PowerShell'de:

~~~powershell
$env:PORT = "3001"
npm start
~~~

PORT 1–65535 arasında bir tam sayı olmalıdır. Varsayılan porta dönmek için Remove-Item Env:PORT kullan. Port kullanımda ise başka port seç veya mevcut sunucuyu durdur. API'yi tarayıcıda açmak yalnızca GET gönderir; POST/PUT/DELETE için Postman kullan.

## Endpoint tablosu

| Method | Yol | İşlem | Başarı yanıtı |
| --- | --- | --- | --- |
| POST | /tasks | Yeni görev oluştur | 201; görev nesnesi ve Location |
| GET | /tasks | Tüm görevleri listele | 200; görev dizisi (boşsa []) |
| GET | /tasks/:id | Görev detayını getir | 200; görev nesnesi |
| PUT | /tasks/:id | Görevi tam güncelle | 200; güncellenmiş görev |
| DELETE | /tasks/:id | Görevi sil | 204; boş gövde |

Hatalı istek 400, bulunamayan görev veya endpoint 404, dosya/sunucu hatası 500 döndürür. POST ve PUT için Content-Type: application/json zorunludur. Gövde sınırı 100 KB'dır. Liste dosyadaki eklenme sırasını korur; PUT sıra değiştirmez. Filtreleme ve sayfalama yoktur.

## Görev modeli ve örnek istekler

Her görev id, title, description, assignee, status, priority, createdAt ve updatedAt alanlarına sahiptir. id UUID v4'tür; tarihler ISO 8601 UTC biçimindedir ve sunucu tarafından yönetilir. Bu üç alan veya bilinmeyen alanlar girişte gönderilemez.

POST http://localhost:3000/tasks:

~~~json
{
  "title": "API dokümantasyonunu hazırla",
  "description": "Endpoint'leri ve örnek JSON isteklerini belgele.",
  "assignee": "Berivan",
  "status": "pending",
  "priority": "high"
}
~~~

POST'ta title ve assignee zorunludur. description gönderilmezse boş metin, status gönderilmezse pending, priority gönderilmezse medium kullanılır. Başarılı yanıtın id değerini sonraki istekler için sakla. Location başlığı /tasks/{id} yolunu içerir.

GET http://localhost:3000/tasks tüm görevleri, GET http://localhost:3000/tasks/{id} tek görevi döndürür. {id} yerine POST yanıtından aldığın gerçek kimliği yaz; süslü parantezleri gönderme.

PUT http://localhost:3000/tasks/{id}:

~~~json
{
  "title": "API dokümantasyonunu tamamla",
  "description": "",
  "assignee": "Ayşe",
  "status": "completed",
  "priority": "medium"
}
~~~

**PUT tam güncellemedir:** title, description, assignee, status ve priority alanlarının tamamı gönderilmelidir. Yalnızca status göndermek 400 üretir; eksik alanlar eski veriden alınmaz. Açıklamayı temizlemek için description boş metin gönderilir. id ve createdAt korunur, updatedAt sunucu saatiyle yenilenir. Olmayan göreve PUT 404 döndürür; yeni görev oluşturmaz.

DELETE http://localhost:3000/tasks/{id} gövdesiz gönderilir. Başarılı yanıt 204'tür; {} veya başarı mesajı içermez. Sonraki GET ve ikinci DELETE aynı kimlik için 404 döndürür.

Doğrulama kuralları:

- title trim sonrası 1–150, assignee 1–100, description 0–2000 karakterdir.
- status: pending, in-progress, completed. priority: low, medium, high.
- Gövde bir JSON nesnesi olmalıdır. Alanlar metin olmalı; null, sayısal değerler ve bilinmeyen alanlar reddedilir.
- title/description/assignee trim edilir; enum değerleri küçük harfle tam eşleşmelidir.
- Aynı başlıklı görevler oluşturulabilir. Durumlar arasında geçiş kısıtlaması yoktur.

## Hata yanıtları

Örnek biçim (açıklama amaçlıdır):

~~~json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Görev verileri geçersiz.",
    "details": [
      { "field": "title", "message": "title alanı zorunludur." }
    ]
  }
}
~~~

code ve message her hatada bulunur; details alan doğrulamasında kullanılır. Geçersiz UUID biçimi INVALID_ID/400, doğru biçimli fakat olmayan UUID TASK_NOT_FOUND/404 üretir. Bozuk JSON INVALID_JSON/400, yanlış içerik türü INVALID_CONTENT_TYPE/400, büyük gövde PAYLOAD_TOO_LARGE/400 üretir. Sunucu ayrıntıları konsolda kalır; yanıt stack trace veya yerel dosya yolu içermez. Tam sözleşme [API tasarımında](docs/api-tasarimi.md) bulunur.

## Kalıcılık ve mimari

Görevler src/data/tasks.json içinde UTF-8 JSON dizisi olarak saklanır. Teslim dosyası boş [] içerir. Dosya yolu service konumuna göre hesaplanır; terminalin çalışma dizinine bağlı değildir. Başlangıçta dosya yoksa oluşturulur. Mevcut bozuk/okunamayan dosya ile sunucu başlamaz ve çıkış kodu 1 verir. Çalışma sırasında okuma/yazma hatası güvenli 500 yanıtına dönüşür; dosya boş veriyle ezilmez.

Service okuma ve oku–değiştir–yaz işlemlerini sıraya alır. Yeni içerik aynı dizindeki benzersiz geçici dosyaya yazılıp tasks.json yerine taşınır. Başarı yanıtı ancak saklama tamamlandıktan sonra verilir. Yazma başarısızsa eski veri korunur, geçici dosya temizlenir ve sonraki işlemler kuyruğa devam eder.

Bu yöntem küçük veri miktarı ve **tek Node.js süreci** içindir. Aynı dosyaya birden çok API süreciyle yazma veya çalışırken elle dosya düzenleme desteklenmez. Disk arızalarına karşı yedekleme garantisi vermez. Aynı göreve eşzamanlı güncellemelerde sırada en son uygulanan geçerli değişiklik kalır.

İstek akışı: logger → JSON ayrıştırıcı → route → controller → service → JSON dosyası. Logger her HTTP isteğinde UTC zamanını, methodu ve originalUrl'yi (sorgu parametreleri dahil) konsola yazar. Ayrıştırıcıdan önce bağlandığı için bozuk JSON istekleri de kaydedilir.

~~~text
TaskFlow/
  src/
    app.js
    server.js
    routes/taskRoutes.js
    controllers/taskController.js
    services/taskService.js
    middleware/logger.js
    middleware/requireJson.js
    middleware/errorHandler.js
    data/tasks.json
  tests/
    helpers/server.js
    tasks.test.js
    postman.test.js
  postman/TaskFlow.postman_collection.json
  docs/
    proje-tanitimi.md
    gereksinim-analizi.md
    veri-modeli.md
    api-tasarimi.md
    test-sonuclari.md
    test-ciktisi.txt
    teslim-kontrol-listesi.md
    postman-screenshots/README.md
  output/pdf/TASKFLOW-Proje-Tanitimi.pdf
  .gitignore
  package.json
  package-lock.json
  README.md
~~~

app.js uygulamayı yapılandırır, port açmaz. server.js veri dosyasını hazırlayıp dinlemeyi başlatır. Route method/yolu controller'a bağlar; controller HTTP kodu ve yanıtını yönetir. Service doğrulama, görev kuralları ve dosya işlemlerini yürütür. Veritabanı, frontend, authentication veya ayrı proje/çalışan modülü yoktur; assignee çalışan adını tutar.

## Otomatik testler

~~~powershell
npm test
~~~

Önceden npm start çalıştırman gerekmez. Testler işletim sisteminin geçici dizininde kaynak kod kopyası ve ayrı tasks.json oluşturup gerçek server.js süreçlerini başlatır. Her test sonunda süreçler kapatılır, geçici dosyalar temizlenir ve asıl görev dosyasının değişmediği doğrulanır.

**Son çalıştırma: 10 test geçti, 0 başarısız, 114 gerçek HTTP isteği.** CRUD ve HTTP kodları, doğrulama, logger, yeniden başlatmada oluşturma/güncelleme/silme kalıcılığı, eşzamanlı işlemler ve dosya arızaları kontrol edildi. rename yazma arızası test sürecinde kontrollü olarak enjekte edilir; gerçek disk arızası yaşandığı iddia edilmez. [Test raporu](docs/test-sonuclari.md) ve [gerçek konsol çıktısı](docs/test-ciktisi-son-kontrol.txt) teslim paketindedir.

## Postman koleksiyonu ve ekran görüntüleri

1. npm start ile API'yi başlat.
2. Postman masaüstünde Import ile [TaskFlow.postman_collection.json](postman/TaskFlow.postman_collection.json) dosyasını içe aktar.
3. Koleksiyon Variables bölümünde baseUrl değerini http://localhost:3000 veya seçtiğin port yap. Ayrı environment gerekmez; aynı isimli environment değişkeni kullanma.
4. 01–11 isteklerini sırayla gönder veya Collection Runner'da sıralarını koruyarak bir kez çalıştır. İlk POST betiği taskId ve createdAt değerlerini kaydeder; diğer istekler aynı görevi kullanır. Her yanıtta Test Results bölümünü kontrol et.
5. Manuel kalıcılık kontrolünde 04 PUT sonrasında sunucuyu kapatıp yeniden aç; yeni POST göndermeden 03 GET detayını tekrar gönder. Güncellenmiş alanların korunduğunu kontrol et. Sonra 05 DELETE ile devam et.
6. Gerçek ekran görüntülerini [adım adım talimatlara](docs/postman-screenshots/README.md) göre docs/postman-screenshots klasörüne kaydet.

Koleksiyonda beş CRUD, silinen göreve erişim, hatalı veri, eksik PUT, geçersiz kimlik, tekrar silme ve bozuk JSON senaryoları bulunur. Yarım kalan çalıştırmada oluşturulmuş görev varsa yalnızca o test görevinin kimliğiyle temizle.

Koleksiyonda 11 istek ve 27 Postman testi bulunur. Kullanıcı istekleri Postman üzerinden çalıştırdı. Gerçek [Runner görüntüsünde](docs/postman-screenshots/15-postman-runner.png) **27 başarılı, 0 başarısız, 0 atlanan ve 0 hata** görülüyor (1 iteration). Bu son kontrolde Postman yeniden çalıştırılmadı; kullanıcının eklediği gerçek görüntüler incelendi. [Görüntü indeksi](docs/postman-screenshots/README.md) mevcut. [Kalıcılık görüntüsü](docs/postman-screenshots/12-kalicilik-kontrolu.png) eklendi; GET yanıtında güncel veriler ve 3/3 test sonucu görülüyor.

## Dokümantasyon ve GitHub teslimi

- [Proje tanıtımı](docs/proje-tanitimi.md) ve [görsel olarak kontrol edilmiş iki sayfalık PDF](output/pdf/TASKFLOW-Proje-Tanitimi.pdf).
- [Gereksinim analizi](docs/gereksinim-analizi.md), [veri modeli](docs/veri-modeli.md), [API tasarımı](docs/api-tasarimi.md).
- [Test sonuçları](docs/test-sonuclari.md) ve [teslim kontrol listesi](docs/teslim-kontrol-listesi.md).
- Önceki aşama kayıtları docs/asama-2.md ve docs/asama-3.md içindedir; güncel davranış bu README'de açıklanır.

GitHub'a yüklemeye hazırlanırken src, tests, postman, docs, output/pdf, README.md, package.json, package-lock.json ve .gitignore dosyalarını teslim et. Postman görüntülerini ve son kontrol raporunu dahil et. node_modules, .env, loglar ve tmp klasörü .gitignore ile hariç tutulur. docs/test-ciktisi.txt gerçek kontrol çıktısı olduğundan teslim dosyasıdır. src/data/tasks.json sürüm kontrolüne dahildir; teslim öncesi gerçek kişisel görev verisi olmadığını kontrol et.

GitHub deposu: [Berivanilgun/TaskFlow](https://github.com/Berivanilgun/TaskFlow). Ana dal `main` olarak hazırlanmıştır. [GitHub teslim hazırlığı](docs/asama-5-github-teslim.md) yayın öncesi kontrolleri ve dosya kapsamını açıklar.
