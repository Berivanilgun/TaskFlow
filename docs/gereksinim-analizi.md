# TASKFLOW — Aşama 1: Gereksinim analizi ve mimari

## Durum ve kapsam

Bu belge uygulama geliştirilmeden önce hazırlanan tasarım sözleşmesidir. Aşama 1 yalnızca analiz ve dokümantasyonu kapsar. Bu belgenin hazırlandığı Aşama 1 sırasında API ve testler henüz yoktu. Güncel uygulama durumu ve çalıştırılan kontroller için README.md ve docs/asama-3.md belgelerine bakılmalıdır.

TASKFLOW, bir yazılım ekibinin görev oluşturmasını, çalışanlara görev atamasını, görevleri görüntülemesini, güncellemesini ve silmesini sağlayan REST API olacaktır. Proje adına rağmen ilk sürümde ayrı bir proje kaydı veya proje endpoint'i yoktur; istenen kapsam görev yönetimidir. Çalışan ataması, görev üzerindeki assignee metnini değiştirerek yapılır; çalışan kayıt sistemi kurulmaz.

## Gereksinimler ve kabul ölçütleri

| Gereksinim | Kabul ölçütü | Uygulama aşaması |
| --- | --- | --- |
| Node.js, Express.js, CommonJS | require/module.exports kullanılır; tek harici çalışma zamanı bağımlılığı Express olur | 2 |
| Routing | Beş zorunlu endpoint taskRoutes.js içinde tanımlanır | 2–3 |
| Oluşturma | Geçerli POST 201 ve oluşturulan görevi döndürür | 3 |
| Listeleme | GET /tasks 200 ve dizi döndürür; boş durumda [] olur | 3 |
| Detay | Mevcut kimlik 200, bulunamayan görev 404 döndürür | 3 |
| Tam güncelleme | PUT tüm düzenlenebilir alanları ister; eksik alan 400 olur | 3 |
| Silme | DELETE 204 döndürür; yanıt gövdesi boş olur | 3 |
| Doğrulama | Geçersiz gövde, alan, tür veya enum 400 ve anlaşılır JSON hata döndürür | 3 |
| Kalıcı saklama | Başarılı değişiklik tasks.json'a yazılır; yeniden başlatmada korunur | 3 |
| Logger | Başarılı ve hatalı her HTTP isteğinde method, URL, zaman konsola yazılır | 3 |
| Hata yönetimi | Bilinmeyen yol 404; beklenmeyen sunucu/dosya hatası 500 JSON döndürür | 3 |
| Postman | Beş CRUD ve iki hata senaryosu koleksiyonda bulunur | 4 |
| Otomatik kontroller | Yerleşik Node.js test araçlarıyla API ve kalıcılık sınanır | 4 |
| Teslim | Türkçe tanıtım, README, kaynaklar, koleksiyon ve ekran görüntüsü klasörü hazırlanır | 1 ve 4 |
| GitHub hazırlığı | .gitignore ve teslim talimatları hazırlanır; commit/push/repo oluşturma kullanıcı iznine bağlıdır | 4 |

Veritabanı, frontend, authentication ve ek harici yardımcı kütüphaneler kapsam dışıdır. Filtreleme, sayfalama, PATCH ve ayrı çalışan/proje endpoint'leri ilk sürüm için planlanmaz.

## Önerilen mimari

İstek akışı: istemci → logger → JSON gövde ayrıştırma → route → controller → service → JSON dosyası. Yanıt controller üzerinden istemciye döner; hatalar merkezi hata middleware'ine iletilir.

- **app.js:** Express uygulamasını oluşturur, middleware ve route'ları bağlar; port dinlemez. Testlerde uygulama ayrı başlatılabilir.
- **server.js:** Uygulamayı başlatır ve portu dinler. Varsayılan port 3000, gerekirse PORT ortam değişkeni kullanılır.
- **routes/taskRoutes.js:** HTTP methodu ve yolu ilgili controller fonksiyonuna bağlar. Routing, isteğin hangi işlemi çağıracağını seçmektir.
- **controllers/taskController.js:** HTTP girdilerini alır, service'i çağırır, durum kodu ve JSON yanıtını oluşturur.
- **services/taskService.js:** Alan doğrulaması, görev bulma, CRUD kuralları ve dosya saklamayı yönetir. Bu küçük projede ayrı repository katmanı gerekmez.
- **middleware/logger.js:** Her isteği method, originalUrl ve UTC zaman damgasıyla konsola yazar. JSON ayrıştırıcıdan önce bağlanır; bozuk JSON istekleri de kaydedilir.
- **middleware/errorHandler.js:** Beklenen hataları ve beklenmeyen hataları ortak JSON biçimine çevirir. Hata ayrıntıları konsolda kalır; istemciye stack trace veya yerel dosya yolu verilmez.
- **data/tasks.json:** Görev dizisini UTF-8 JSON olarak saklar.

Middleware, istek işlenirken araya giren fonksiyondur. Logger kayıt yaptıktan sonra next() ile sıradaki işleme geçer. CRUD, Create (oluştur), Read (oku), Update (güncelle), Delete (sil) işlemleridir. CommonJS, modülleri require ile yükleyip module.exports ile dışa aktarma düzenidir.

## Planlanan klasörler

Aşağıdaki yapı hedef yapıdır; src, tests ve postman dosyaları sonraki aşamalarda oluşturulacaktır. Mevcut TaskFlow klasörü proje köküdür; içine ikinci bir taskflow klasörü açılmaz.

~~~text
TaskFlow/
  src/
    app.js
    server.js
    routes/taskRoutes.js
    controllers/taskController.js
    services/taskService.js
    middleware/logger.js
    middleware/errorHandler.js
    data/tasks.json
  docs/
    gereksinim-analizi.md
    proje-tanitimi.md
    api-tasarimi.md
    veri-modeli.md
    postman-screenshots/README.md
  postman/TaskFlow.postman_collection.json
  tests/
  .gitignore
  package.json
  package-lock.json
  README.md
~~~

## JSON saklama kararları

Dosya yolu service dosyasının konumuna göre çözülür; terminalin çalışma dizinine bağlı olmaz. Başlangıç verisi boş dizi [] olacaktır. Dosya yoksa boş diziyle oluşturulabilir; mevcut dosya bozuksa veya okunamıyorsa boş veriyle üzerine yazılmaz, açık hata verilir. Başlangıç hatası sunucunun dinlemeye başlamasını engeller; çalışma sırasında dosya hatası 500 olur.

Her değişiklikte oku–değiştir–yaz bütünü aynı süreçte sıraya alınır. Böylece aynı anda gelen iki POST veya PUT birbirinin değişikliğini kaybetmez. Yeni içerik aynı dizindeki geçici dosyaya yazılıp hedef dosyanın yerine taşınır; başarılı yanıt ancak saklama tamamlandığında verilir. Okuma, tamamlanmış bir dosya sürümünü görür. Dosyadaki görevlerin şeması ve benzersiz kimlikleri de kontrol edilir.

Bu sürüm tek Node.js süreci ve küçük veri miktarı için tasarlanır. Birden fazla sunucu süreci veya çalışırken elle dosya düzenleme desteklenmez. Geçici dosya ile değiştirme, işletim sistemi ve disk düzeyindeki bütün arızalara karşı yedekleme garantisi değildir. Bu sınırlar README'de belirtilecektir.

## Doğrulama planı ve aşama sınırları

Aşama 2: npm projesi, Express, modüller ve route bağlantıları.
Aşama 3: CRUD, doğrulama, kalıcılık, logger ve JSON hata yanıtları.
Aşama 4: Postman koleksiyonu, yerleşik testler, README'nin çalıştırma talimatları ve teslim kontrolü.

Test planı; CRUD, 404, bozuk/eksik/geçersiz JSON, tam PUT, silmenin boş yanıtı, kimlik/tarih koruması, yeniden başlatmada kalıcılık ve eşzamanlı değişiklikleri kapsar. Test verisi ayrı geçici dosyaya yazılır; kullanıcı verisi değiştirilmez. Dosya hatasında yanlış başarı yanıtı verilmediği de sınanır.

Postman ekran görüntülerini kullanıcı gerçek testleri çalıştırarak alacaktır. Başarı iddiası yalnızca gerçekten çalıştırılan kontrollerin sonucuna dayanır.
