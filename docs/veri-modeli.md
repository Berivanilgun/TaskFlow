# TASKFLOW — Veri modeli

## Görev nesnesi

Tek veri varlığı görevdir. Dosya tüm görevleri içeren bir JSON dizisidir. Aşağıdaki limitler yönerge zorunluluğu değil, ilk sürüm için seçilen tutarlı doğrulama kurallarıdır.

| Alan | Tür | POST | PUT | Kural |
| --- | --- | --- | --- | --- |
| id | string | Sunucu üretir | Korunur | Benzersiz UUID v4; istemci gönderemez |
| title | string | Zorunlu | Zorunlu | trim sonrası 1–150 karakter |
| description | string | İsteğe bağlı; varsayılan boş metin | Zorunlu | trim sonrası 0–2000 karakter; boş olabilir |
| assignee | string | Zorunlu | Zorunlu | trim sonrası 1–100 karakter; çalışan adı |
| status | string | İsteğe bağlı; pending | Zorunlu | pending, in-progress, completed |
| priority | string | İsteğe bağlı; medium | Zorunlu | low, medium, high |
| createdAt | string | Sunucu üretir | Korunur | ISO 8601 UTC tarihi |
| updatedAt | string | Sunucu üretir | Sunucu yeniler | ISO 8601 UTC tarihi |

UUID üretimi Node.js'in yerleşik crypto.randomUUID işleviyle planlanır. İstemci kimliği sayı olarak yorumlamaz. Kimlik üretiminde mevcut kayıtlarda çakışma kontrolü yapılır. Tarihler sunucu saatinden üretilir; POST sırasında createdAt ve updatedAt aynı değerdir. PUT sırasında createdAt korunur ve updatedAt işlem zamanıyla yeniden atanır; hızlı işlemlerde milisaniye değeri aynı olabilir.

## Doğrulama kuralları

- POST ve PUT gövdesi bir JSON nesnesi olmalıdır; null, dizi, sayı veya metin kabul edilmez.
- Kabul edilen giriş alanları yalnızca title, description, assignee, status ve priority'dir. Bilinmeyen alanlar ve sunucunun yönettiği alanlar 400 üretir.
- Metin türleri dönüştürülmez; örneğin sayısal assignee kabul edilmez. null hiçbir giriş alanında kabul edilmez.
- title, description ve assignee başındaki/sonundaki boşluklardan temizlenir; iç boşluklar korunur. Uzunluk JavaScript string.length ile ölçülür (UTF-16 kod birimleri).
- Enum değerleri küçük harfle ve tam eşleşmeyle gönderilir; otomatik harf/boşluk düzeltmesi yapılmaz.
- POST varsayılanları yalnızca alan hiç gönderilmediğinde uygulanır. Boş status veya null priority varsayılana çevrilmez.
- PUT beş düzenlenebilir alanın tamamını gerektirir. Eksik alanlar eski kayıttan kopyalanmaz ve POST varsayılanları PUT'ta uygulanmaz.
- Geçersiz veri, dosyada hiçbir değişiklik oluşturmaz.

Durumlar: pending = bekliyor, in-progress = devam ediyor, completed = tamamlandı. Bu sürümde durumlar arasında geçiş kısıtlaması yoktur; tamamlanmış görev yeniden açılabilir. Atamayı değiştirmek için tam PUT gövdesindeki assignee değiştirilir. Aynı başlıkla birden çok görev oluşturulabilir; benzersizlik yalnızca id için geçerlidir.

## Örnek kayıt

Bu kayıt açıklama amaçlıdır; gerçek API çıktısı veya test sonucu değildir.

~~~json
{
  "id": "c3640464-73f0-4c39-bfe3-62ebc96d727f",
  "title": "Görev listeleme endpoint'ini geliştir",
  "description": "GET /tasks için controller ve service fonksiyonlarını yaz.",
  "assignee": "Berivan",
  "status": "pending",
  "priority": "medium",
  "createdAt": "2026-10-09T09:00:00.000Z",
  "updatedAt": "2026-10-09T09:00:00.000Z"
}
~~~

src/data/tasks.json üst seviyede bu nesnelerden oluşan dizi tutar; görev yokken [] içerir. ISO tarihlerindeki Z UTC'yi ifade eder. Saat dilimine göre görüntüleme istemcinin sorumluluğundadır.
