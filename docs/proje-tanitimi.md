# TASKFLOW — Görev ve Proje Yönetim Sistemi API

## Amaç ve kapsam

TASKFLOW, bir yazılım şirketinin ekip içindeki görevleri ve çalışan sorumluluklarını takip edebilmesi için geliştirilen REST API projesidir. Yazılım geliştirme stajı kapsamında Node.js ile backend geliştirme temellerini uygulamaya dönüştürür. Sistem yeni görev oluşturma, çalışan atama, görevleri listeleme, detay görüntüleme, tam güncelleme ve silme işlemlerini sunar.

İlk sürümde görev tek veri varlığıdır. Her görev id, title, description, assignee, status, priority, createdAt ve updatedAt alanlarını taşır. Çalışan ataması assignee metniyle yapılır. Proje adına rağmen ayrı proje veya çalışan kayıt sistemi bu sürümün kapsamına dahil değildir.

## Kullanım senaryosu

Bir ekip sorumlusu, hazırlanması gereken API dokümantasyonu için yeni bir görev oluşturur ve görevi Berivan'a atar. Başlık, açıklama ve öncelik belirlenir; başlangıç durumu pending olarak kaydedilir. Ekip üyeleri görev listesini ve seçilen görevin detaylarını görüntüler.

Çalışma başladığında görev in-progress durumuna, tamamlandığında completed durumuna güncellenir. Gerekirse görev başka çalışana atanır. Güncelleme isteği, düzenlenebilir beş alanın tamamını içerir. Gereksiz görev silinir ve sonraki sorguda bulunamaz. Sunucu kapatılıp yeniden açıldığında görev bilgileri ve yapılan değişiklikler korunur.

## Özellikler ve API

API Node.js üzerinde Express.js ile çalışır; JavaScript kodları CommonJS modülleriyle düzenlenmiştir. JSON istek ve yanıt biçimidir. npm bağımlılıkları yönetir; tek doğrudan harici bağımlılık Express'tir. UUID kimliği ve UTC tarihleri sunucu tarafından üretilir.

Geçersiz veriler 400, bulunamayan görevler 404, beklenmeyen sunucu veya dosya hataları 500 koduyla anlaşılır JSON hata döndürür. PUT, başlık, açıklama, çalışan, durum ve önceliğin tamamını gerektirir. Kimlik ve oluşturulma tarihi değişmez; son güncelleme tarihi yenilenir.

| Method ve endpoint | İşlem | Başarı |
| --- | --- | --- |
| POST /tasks | Görev oluşturma | 201 |
| GET /tasks | Görev listesi | 200 |
| GET /tasks/:id | Görev detayı | 200 |
| PUT /tasks/:id | Tam güncelleme | 200 |
| DELETE /tasks/:id | Görev silme | 204 |

## Mimari ve veri saklama

Kod; route, controller, service ve middleware sorumluluklarına ayrılmıştır. Route istek yolunu ve HTTP methodunu ilgili controller'a bağlar. Controller HTTP yanıtını hazırlarken service doğrulama, CRUD kuralları ve dosya işlemlerini yönetir. app.js uygulamayı yapılandırır; server.js veri dosyasını kontrol edip port dinlemeyi başlatır.

Görevler src/data/tasks.json dosyasında kalıcı JSON dizisi olarak saklanır. İşlemler tek süreç içinde sıraya alınır. Değişiklik önce geçici dosyaya yazılır, ardından asıl dosyanın yerine taşınır; başarı yanıtı saklama tamamlanınca gönderilir. Bozuk dosya boş veriyle ezilmez. Başlangıçta okunamayan veya bozuk veri sunucunun açılmasını engeller.

Özel logger middleware'i her HTTP isteğinin methodunu, endpoint adresini ve UTC zaman damgasını konsola yazar. JSON ayrıştırıcıdan önce çalıştığı için hatalı JSON isteklerini de kaydeder. Merkezi hata middleware'i teknik sunucu ayrıntılarını istemciye vermeden tutarlı hata yanıtı üretir.

## Eğitim hedefleri ve doğrulama

Proje, Node.js çalışma mantığı, Express routing, middleware akışı, REST kaynakları, CRUD, HTTP durum kodları ve kalıcı veri saklamayı öğretmeyi hedefler. Geliştirme ihtiyaç analizi, uygulama iskeleti, görev modülü ve test/teslim olmak üzere dört aşamada yürütülmüştür. Kaynak kodlar ve Türkçe belgeler birlikte incelenebilir.

Node.js'in yerleşik test araçlarıyla hazırlanan 10 otomatik testin tamamı çalıştırılarak geçti. Testler geçici kaynak kod kopyası ve ayrı görev dosyası kullanır. Başarılı ve hatalı HTTP yanıtları, logger, gerçek süreç yeniden başlatmalarında kalıcılık, eşzamanlı işlemler ve kontrollü dosya arızaları sınandı. Postman koleksiyonunun 11 isteği kullanıcı tarafından gerçek Postman uygulamasında çalıştırıldı. Collection Runner sonucu 27 başarılı, 0 başarısız testtir; gerçek Runner görüntüsü incelendi. Kullanıcının sunduğu kalıcılık görüntüsünde güncel görev verileri ve 200 yanıtı doğrulandı; yeniden başlatmada kalıcılık otomatik testlerde de geçti.

## Teslim ve kullanım sınırları

Teslim paketi kaynak kodları, package.json ve kilit dosyası, .gitignore, kurulum ve kullanım README'si, veri modeli, API tasarımı, testler, Postman koleksiyonu ve bu tanıtım dokümanını içerir. Gerçek test çıktısı ve değerlendirme kontrol listesi ayrıca hazırlanmıştır. Beş CRUD ve altı hata senaryosunun gerçek Postman görüntüleri ile 27 başarılı, 0 başarısız Runner sonucu teslim paketindedir. Görüntü indeksi ve kalıcılık kanıtı son kontrol raporunda açıklanmıştır.

JSON saklama tek Node.js süreci ve küçük veri miktarı için uygundur. Aynı dosyaya birden çok sunucudan yazmak desteklenmez. Veritabanı, frontend, authentication ve ayrı proje/çalışan modülleri eklenmemiştir. GitHub'a yükleme için dosyalar hazırdır; kullanıcı izni olmadan commit, push veya repository oluşturma yapılmamıştır.

Sayfa düzeni doğrulanmış iki sayfalık [PDF sürümü](../output/pdf/TASKFLOW-Proje-Tanitimi.pdf) teslim paketine eklenmiştir.
