# Gerçek Postman ekran görüntüleri

11 Ekim 2026 son kontrolünde tüm PNG dosyaları açılarak incelendi. Kullanıcının gerçek Postman görüntüleridir. Dosya adları içerikte görülen istek numarasıyla eşleştirildi; test içerikleri değiştirilmedi. Listeleme görüntüsünde yalnızca üst ve sol kenarlar kırpılarak kişisel hesap çubuğu çıkarıldı.

| Dosya | Görselde doğrulanan sonuç |
| --- | --- |
| [01-gorev-olustur.png](01-gorev-olustur.png) | POST /tasks: 201, görev nesnesi, 3/3 |
| [02-tum-gorevleri-listele.png](02-tum-gorevleri-listele.png) | GET /tasks: 200, görev dizisi, 3/3; kişisel hesap çubuğu kırpıldı |
| [03-gorev-detayi.png](03-gorev-detayi.png) | GET /tasks/:id: 200, görev nesnesi, 3/3 |
| [04-gorev-guncelle.png](04-gorev-guncelle.png) | PUT /tasks/:id: 200, güncellenmiş alanlar, 3/3 |
| [05-gorev-sil.png](05-gorev-sil.png) | DELETE /tasks/:id: 204, boş gövde, 2/2 |
| [06-silinen-goreve-eris.png](06-silinen-goreve-eris.png) | GET silinen görev: 404 TASK_NOT_FOUND, 2/2 |
| [07-hatali-gorev-verisi.png](07-hatali-gorev-verisi.png) | POST hatalı veri: 400 VALIDATION_ERROR, 3/3 |
| [08-eksik-put.png](08-eksik-put.png) | PUT eksik veri: 400 VALIDATION_ERROR, 2/2 |
| [09-gecersiz-kimlik.png](09-gecersiz-kimlik.png) | GET geçersiz kimlik: 400 INVALID_ID, 2/2 |
| [10-silinen-gorevi-tekrar-sil.png](10-silinen-gorevi-tekrar-sil.png) | DELETE silinen görev: 404 TASK_NOT_FOUND, 2/2 |
| [11-bozuk-json.png](11-bozuk-json.png) | POST bozuk JSON: 400 INVALID_JSON, 2/2 |
| [12-kalicilik-kontrolu.png](12-kalicilik-kontrolu.png) | GET 200, güncellenmiş görev verileri korunmuş, 3/3 |
| [15-postman-runner.png](15-postman-runner.png) | 27 başarılı, 0 başarısız, 0 atlanan, 0 hata; 1 iteration |

Beş zorunlu CRUD ve altı hata senaryosu mevcuttur. PNG dosyalarındaki Test Results sayıları koleksiyonun toplam 27 testiyle uyumludur. Runner yeni bir görev kimliği kullanır; manuel çalışmanın kimliğiyle aynı olması gerekmez.

## Kalıcılık kanıtı

Kullanıcının gönderdiği `12-kalicilik-kontrolu.png` eklendi. Aynı görev kimliği, createdAt ve updatedAt önceki PUT görüntüsüyle eşleşir. Güncellenmiş başlık, Ayşe ataması, completed durumu ve medium önceliği GET yanıtında korunmuştur. HTTP 200 ve Test Results 3/3 görülür. Sunucuyu yeniden başlatma işlemi tek karede görünmez; gerçek yeniden başlatmalarda kalıcılık otomatik testlerle de doğrulanmıştır.

Ayrı logger görüntüsü mevcut değil; logger otomatik testlerle doğrulandı. İsteğe bağlı terminal görüntüsü `14-logger.png` olarak eklenebilir. Adsız `.png` dosyası Runner görüntüsünün birebir kopyasıdır ve .gitignore ile teslim kapsamından çıkarılmıştır.

Public teslimde `02-tum-gorevleri-listele.png` mevcuttur. Yalnızca kırpma uygulandı; GET, 200 OK, görev dizisi ve 3/3 sonucu korundu. Özgün görüntü Git kapsamı dışındaki tmp/02-listeleme-original.png içinde saklandı. Görevlerdeki ilk adlar örnek atama verisidir; gerçek görev dosyası boş [] içerir.
