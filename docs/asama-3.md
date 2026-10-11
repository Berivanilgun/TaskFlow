# TASKFLOW — Aşama 3 uygulama ve kontrol notları

Tarihsel aşama kaydı: bu belge ilgili aşamanın kapanış durumunu anlatır. Güncel durum README.md, test-sonuclari.md ve teslim-kontrol-listesi.md içindedir.

## Tamamlanan değişiklikler

501 yanıtları gerçek CRUD ile değiştirildi. Route → controller → service mimarisi korundu. Yeni dosyalar taskService.js, logger.js, requireJson.js ve src/data/tasks.json oldu. app.js, server.js, taskRoutes.js, taskController.js, errorHandler.js ve README güncellendi. Yeni npm bağımlılığı eklenmedi.

## Kodun önemli kısımları

Service validateInput ile nesne türünü, izin verilen alanları, metin limitlerini ve enum değerlerini kontrol eder. POST'ta gönderilmeyen description/status/priority için varsayılanlar uygulanır; PUT'ta fullUpdate=true olduğundan beş alanın tamamı gerekir. Kimlik crypto.randomUUID ile üretilir. Tarihler Date.toISOString ile UTC biçiminde saklanır. PUT yeni görev alanlarını oluştururken eski id/createdAt değerlerini açıkça korur.

Service içindeki enqueue fonksiyonu Promise zinciriyle her okuma veya oku–değiştir–yaz işlemini sıraya koyar. pendingOperation hata alsa bile sonraki işlemin çalışabilmesi için zincirde hata yakalanır; işlem hatası çağırana yine iletilir. Kuyruk tek süreç içindir.

writeTasks yeni diziyi benzersiz .tmp dosyasına yazar, ardından fs.rename ile tasks.json yerine taşır. try/finally geçici dosya temizliğini sağlar. Controller await ile bu işlem bitene kadar bekler; böylece yazma hatasında 201/200/204 gönderilmez.

readTasks JSON ayrıştırmasının yanında dosyadaki sekiz alanı, değerleri, UUID'yi, tarihleri ve kimlik benzersizliğini kontrol eder. Dosya şema hataları istemci kaynaklı 400 olarak gösterilmez; 500'e dönüşür. initialize yalnızca eksik dosyayı oluşturur; mevcut dosyayı boş veriye çevirmez. server.js initialize tamamlanmadan dinlemeye başlamaz.

Controller HTTP ile ilgilenir: oluşturma 201 ve Location, liste/detay/güncelleme 200, silme 204 ve end() ile boş yanıt verir. Express 5 async controller hatalarını errorHandler'a iletir; bunun için ayrı yardımcı kütüphane gerekmez. [Express resmî hata yönetimi belgesi](https://expressjs.com/en/5x/guide/error-handling/)

Logger app.js içinde express.json'dan önce bağlanır. Konsola UTC zaman, req.method ve req.originalUrl yazar; next() ile akışı sürdürür. requireJson, POST/PUT Content-Type başlığını kontrol eder. errorHandler doğrulama, ayrıştırma ve dosya hatalarını tutarlı JSON'a çevirir; sunucu ayrıntıları konsolda kalır.

## Gerçek HTTP kontrolleri

Kontroller geçici dizindeki kaynak kod kopyasında, ayrı tasks.json ile yapıldı. Sunucular gerçek ayrı Node.js süreçleri olarak başlatılıp durduruldu. Son çalıştırmada 13 kontrol grubu ve 74 HTTP isteği başarılı oldu:

| Kontrol | Sonuç |
| --- | --- |
| Eksik dosya başlangıcı ve boş GET | Dosya oluşturuldu; 200 ve [] |
| POST | 201, Location, UUID, sekiz alan, trim, varsayılanlar ve disk kaydı doğru |
| Liste ve detay | 200; büyük harfli UUID doğru normalleştirildi |
| Geçersiz veri, içerik türü/kodlama, JSON, kimlik, eksik PUT | 400; dosya değişmedi |
| Olmayan görev ve bilinmeyen route/method | 404 |
| Tam PUT | 200; beş alan değişti; id/createdAt korundu |
| Oluşturma/güncelleme sonrası gerçek süreç yeniden başlatma | Veri korundu |
| DELETE ve yeniden başlatma | 204 boş gövde; diskten silindi, tekrar GET/DELETE 404 |
| 12 paralel POST, ardından 12 paralel PUT/DELETE | Kayıp veri/güncelleme görülmedi |
| Bozuk JSON/şema, yinelenen id, runtime eksik dosya | 500; veri sessizce ezilmedi |
| Enjekte edilen rename arızası | POST/PUT/DELETE 500; eski veri korundu, geçici dosya temizlendi, kuyruk devam etti |
| Logger | 74 isteğin tamamında method, originalUrl ve UTC zaman kaydı |
| Bozuk başlangıç dosyası | Sunucu dinlemedi, çıkış kodu 1; dosya değişmedi |

Yazma arızası test kopyasında kontrollü olarak enjekte edildi; fiziksel disk arızası veya gerçek işletim sistemi izin arızası yaşandığı iddia edilmez. Test sonunda bütün test sunucuları kapatıldı. Asıl src/data/tasks.json dosyasının içeriğinin değişmediği doğrulandı.

Asıl proje kökünde npm start da localhost:3000 üzerinde başarıyla başladı; kontrol sonunda durduruldu.

JavaScript sözdizimi node --check ile geçti. npm ls --depth=0 yalnızca express@5.3.0 gösterdi. Bu kontroller geçici doğrulama betiğiyle yapıldı; tests altında kalıcı test paketi oluşturulmadı. Postman çalıştırılmadı ve ekran görüntüsü üretilmedi.

## Sonraki aşama

Aşama 4 kullanıcı onayını bekler: Node.js yerleşik test paketi, Postman koleksiyonu, gerçek ekran görüntülerinin kullanıcı tarafından alınması ve teslim dokümanlarının son kontrolü. Commit, push veya GitHub repository oluşturma yapılmadı.
