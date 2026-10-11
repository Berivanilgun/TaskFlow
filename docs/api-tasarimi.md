# TASKFLOW — REST API tasarımı

## Ortak sözleşme

Planlanan yerel adres http://localhost:3000 olacaktır. POST ve PUT için Content-Type: application/json zorunludur. JSON yanıtlarında aynı içerik türü kullanılır; 204 yanıtında gövde yoktur. Bu ilk sürümde geçersiz içerik türü de yönergede istenen 400 koduyla ele alınır. Gövde boyutu sınırı 100 KB olarak planlanır; aşımı 400 JSON hatası olur.

Başarılı tek kayıt yanıtı doğrudan görev nesnesi, liste yanıtı doğrudan dizidir. Kimlik ve tarihler sunucu tarafından yönetilir. Aşağıdaki örnekler sözleşme örnekleridir; çalıştırılmış test çıktıları değildir.

## Endpoint tablosu

| Method | Yol | İşlem | Başarılı yanıt | Beklenen hata |
| --- | --- | --- | --- | --- |
| POST | /tasks | Görev oluştur | 201; görev; Location: /tasks/{id} | 400 |
| GET | /tasks | Tüm görevleri listele | 200; görev dizisi veya [] | — |
| GET | /tasks/:id | Görev detayını getir | 200; görev | 400 geçersiz kimlik; 404 bulunamadı |
| PUT | /tasks/:id | Düzenlenebilir alanları tamamen değiştir | 200; güncel görev | 400; 404 |
| DELETE | /tasks/:id | Görevi kalıcı sil | 204; boş gövde | 400 geçersiz kimlik; 404 bulunamadı |

Bütün endpoint'ler beklenmeyen sunucu veya dosya hatasında 500 döndürebilir. Listeleme dosyadaki eklenme sırasını korur; PUT sıra değiştirmez. Filtreleme ve sayfalama yoktur. Kimlik UUID v4 biçiminde kontrol edilir ve karşılaştırma için küçük harfe çevrilir. Biçimi doğru fakat kayıtlı olmayan UUID 404 üretir; bozuk UUID 400 üretir. Silinmiş kayda ikinci DELETE de 404 olur. Bilinmeyen yollar ve tanımlanmamış method/yol birleşimleri 404 JSON döndürür.

## POST /tasks

Asgari gövde:

~~~json
{
  "title": "API tasarımını hazırla",
  "assignee": "Berivan"
}
~~~

Bu istekte description boş metin, status pending, priority medium olur. Tam gövde örneği:

~~~json
{
  "title": "API tasarımını hazırla",
  "description": "Endpoint tablosunu ve hata yanıtlarını belgele.",
  "assignee": "Berivan",
  "status": "pending",
  "priority": "high"
}
~~~

Yanıt 201 ve veri-modeli.md'deki sekiz alanlı görev nesnesidir. Location başlığı oluşturulan kaynağın yolunu içerir. Aynı POST'un tekrarlanması yeni id ile yeni görev oluşturur.

## GET /tasks ve GET /tasks/:id

GET /tasks için istek gövdesi gerekmez. Yanıt 200 ve görev dizisidir. GET /tasks/{id} yalnızca ilgili görev nesnesini döndürür. Görev yoksa 404 hata yanıtı döner.

## PUT /tasks/:id: tam güncelleme

~~~json
{
  "title": "API tasarımını tamamla",
  "description": "Tam güncelleme ve hata kurallarını gözden geçir.",
  "assignee": "Ayşe",
  "status": "in-progress",
  "priority": "medium"
}
~~~

title, description, assignee, status, priority her PUT'ta bulunmalıdır. Örneğin yalnızca status göndermek 400 üretir; eski description kendiliğinden korunmaz. Açıklamayı temizlemek için description boş metin olarak gönderilir. Sunucu id ve createdAt değerlerini korur, updatedAt değerini işlem zamanıyla yeniden atar. Bu, istemcinin düzenleyebileceği tüm alanların değiştirilmesidir; sunucu meta verilerini istemci yönetmez.

Olmayan kayda PUT yeni kayıt oluşturmaz, 404 verir. İşlem sırası JSON ayrıştırma ve kimlik/gövde doğrulaması, ardından kaydı bulma ve saklamadır; hem geçersiz gövde hem bulunamayan kimlik varsa 400 önceliklidir. Geçerli istekte dosya yazımı bitince 200 ve güncel görev döner. Eşzamanlı güncellemelerde sırada en son tamamlanan geçerli değişiklik geçerlidir; sürüm/ETag kontrolü bu kapsamda yoktur.

## DELETE /tasks/:id

Gövde gerekmez. Kayıt dosyadan kaldırıldıktan sonra 204 gönderilir. Başarı mesajı veya {} bile gönderilmez. Sonraki GET aynı kimlik için 404 döndürmelidir.

## Hata biçimi

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

error.code ve error.message tüm hatalarda bulunur; details yalnızca alan doğrulamasında bulunur. Mesajlar Türkçedir, kodlar programatik kullanım için sabittir.

| HTTP | error.code | Örnek message |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | Görev verileri geçersiz. |
| 400 | INVALID_JSON | İstek gövdesi geçerli JSON olmalıdır. |
| 400 | INVALID_CONTENT_TYPE | Content-Type application/json olmalıdır. |
| 400 | PAYLOAD_TOO_LARGE | İstek gövdesi 100 KB sınırını aşıyor. |
| 400 | INVALID_REQUEST | İstek gövdesi veya kodlaması geçersiz. |
| 400 | INVALID_ID | Görev kimliği geçerli bir UUID v4 olmalıdır. |
| 404 | TASK_NOT_FOUND | Görev bulunamadı. |
| 404 | ROUTE_NOT_FOUND | İstenen endpoint bulunamadı. |
| 500 | INTERNAL_SERVER_ERROR | Sunucu hatası oluştu. |

Beklenmeyen hataların teknik ayrıntıları istemciye verilmez. Doğrulama hataları veri dosyasını değiştirmez; saklama başarısızsa başarı kodu dönmez.

## Aşama 4 test sözleşmesi

1. POST ile görev oluştur; 201, Location ve sekiz alanı kontrol et, id'yi Postman değişkenine kaydet.
2. GET /tasks ile 200 ve oluşturulan görevin listede olduğunu kontrol et.
3. GET /tasks/{id} ile 200 ve id eşleşmesini kontrol et.
4. Tam PUT ile 200, yeni alanlar, korunan id/createdAt ve geçerli updatedAt değerini kontrol et.
5. DELETE ile 204 ve gerçekten boş gövdeyi kontrol et.
6. Silinen kimliğe GET ile 404 ve TASK_NOT_FOUND kodunu kontrol et.
7. Hatalı POST (örneğin boş title ve priority: urgent) ile 400 kontrol et.

Ek otomatik senaryolar: eksik PUT, bozuk JSON, yanlış tür, sunucu alanı gönderme, geçersiz UUID, boş liste, POST varsayılanları, yeniden başlatmada kalıcılık, eşzamanlı yazma ve dosya hataları. Bu liste Aşama 1 test planıdır. Aşama 3’te yapılan gerçek HTTP kontrolleri docs/asama-3.md içinde kayıtlıdır; kalıcı test paketi ve Postman koleksiyonu Aşama 4’te eklendi. Güncel sonuçlar docs/test-sonuclari.md içindedir. Gerçek Postman görüntüleri kullanıcı tarafından eklendi; Runner sonucu 27 başarılı, 0 başarısızdır. Güncel kanıt durumu postman-screenshots/README.md ve son-kontrol-raporu.md içindedir.
