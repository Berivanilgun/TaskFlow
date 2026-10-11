# TASKFLOW — Aşama 2 uygulama notları

Tarihsel aşama kaydı: bu belge ilgili aşamanın kapanış durumunu anlatır. Güncel durum README.md, test-sonuclari.md ve teslim-kontrol-listesi.md içindedir.

## Tamamlanan işler

CommonJS npm projesi kuruldu; Express 5.3.0 kuruldu ve package-lock.json oluşturuldu. Node.js 24.18.0 ile kontroller yapıldı; package.json alt sınırı Node.js 22 olarak belirlendi. Ek doğrudan bağımlılık eklenmedi.

app.js ile server.js ayrıldı. Uygulamayı require('./app') ile yüklemek port açmaz; sadece server.js app.listen ile dinlemeyi başlatır. Bu ayrım ileride testleri geçici portlarda çalıştırmayı kolaylaştırır.

## Routing ve CommonJS

express.Router() görev yollarını ayrı bir modülde toplar. app.use('/tasks', taskRoutes) bu modülü /tasks altında bağlar. Bu nedenle router.get('/') dışarıdan GET /tasks, router.get('/:id') ise GET /tasks/{id} olur. Dinamik :id değeri controller içinde req.params.id üzerinden alınacaktır.

require('../controllers/taskController') controller modülünü yükler; module.exports = router router'ı app.js için kullanılabilir kılar. Controller fonksiyonları da module.exports ile dışa aktarılır.

app.use(express.json({ limit: '100kb' })) JSON gövdesini ayrıştırır. Route'lardan sonra gelen 404 middleware'i eşleşmeyen istekleri karşılar. En sondaki dört parametreli errorHandler hata yanıtlarını JSON biçiminde verir. Logger bu aşamada eklenmedi; Aşama 3'te JSON ayrıştırıcıdan önce bağlanacaktır.

## Geçici davranış

Beş controller fonksiyonu 501 NOT_IMPLEMENTED döndürür. Bu kod yalnızca Aşama 2 iskeletinin geçici davranışıdır; Aşama 1 sözleşmesinin nihai durum kodlarını değiştirmez. CRUD başarı kodları, kimlik/alan doğrulaması, Content-Type kontrolü, service ve JSON kalıcılığı Aşama 3'te uygulanacaktır. src/services, src/data, tests ve postman klasörleri .gitkeep ile ayrılmıştır.

## Çalıştırılan kontroller

- Beş JavaScript dosyasında node --check: geçti.
- npm ls --depth=0: tek doğrudan bağımlılık express@5.3.0.
- Geçici portta beş CRUD route'u: her biri 501 NOT_IMPLEMENTED döndürdü.
- Bilinmeyen yol ve PATCH /tasks/example: 404 ROUTE_NOT_FOUND döndürdü.
- Bozuk JSON: 400 INVALID_JSON döndürdü.
- 100 KB sınırını aşan JSON gövdesi: 400 PAYLOAD_TOO_LARGE döndürdü.
- npm start: localhost:3000 üzerinde başladı; kontrol bitince durduruldu.

Dokuz HTTP kontrolü gerçek isteklerle yapıldı; bunlar CRUD testi değildir. Postman kullanılmadı ve ekran görüntüsü üretilmedi. Otomatik test dosyaları Aşama 4'e bırakıldı. Commit/push/repository oluşturma işlemi yapılmadı.

## Sonraki aşama

Aşama 3 kullanıcı onayını bekler: görev service'i, beş gerçek CRUD işlemi, doğrulama, JSON dosyasında kalıcılık ve özel logger middleware'i.
