# Stok Sayım Uygulaması

Modern ve kullanıcı dostu bir stok sayım uygulaması. Bu uygulama ile stok sayımı yapabilir, sayım raporlarını Excel olarak indirebilir ve e-posta ile gönderebilirsiniz.

## Özellikler

- Basit kullanıcı girişi
- Stok sayım işlemleri
- Barkod ile ürün girişi
- Sayım miktarı için ekran klavyesi
- Excel'e dışa aktarma
- Gmail API ile doğrudan e-posta gönderme
- Sayım kayıtlarını güncelleme ve silme

## Kurulum

```bash
# Depoyu klonlayın
git clone https://github.com/yourusername/stok-sayim.git
cd stok-sayim

# Bağımlılıkları yükleyin
npm install

# Uygulamayı başlatın
npm start
```

## Gmail API ile E-posta Gönderme Özelliğini Yapılandırma

Uygulama, sayım raporlarını e-posta ile göndermek için direkt olarak Gmail API'yi kullanır. Bu özelliği kullanmak için:

1. **Google Cloud Console'da Proje Oluşturma**:
   - [Google Cloud Console](https://console.cloud.google.com/) adresine gidin
   - Yeni bir proje oluşturun veya mevcut bir projeyi seçin
   - Sol menüden "APIs & Services" > "Library" seçeneğine gidin
   - "Gmail API" aratın ve etkinleştirin

2. **OAuth Consent Screen Oluşturma**:
   - "OAuth consent screen" bölümüne gidin
   - "External" veya "Internal" kullanıcı tipini seçin (test için External seçebilirsiniz)
   - Uygulama adı, kullanıcı destek e-postası gibi gerekli bilgileri doldurun
   - "Scopes" bölümünde "https://www.googleapis.com/auth/gmail.send" kapsamını ekleyin
   - Test kullanıcıları ekleyin (External seçtiyseniz)

3. **OAuth 2.0 Client ID Oluşturma**:
   - "Credentials" bölümüne gidin
   - "Create Credentials" > "OAuth client ID" seçeneğine tıklayın
   - Uygulama tipini "Web application" olarak seçin
   - "Authorized JavaScript origins" alanına `http://localhost:3000` ekleyin
   - "Authorized redirect URIs" alanına da `http://localhost:3000` ekleyin
   - "Create" düğmesine tıklayın ve Client ID ve Client Secret bilgilerinizi alın

4. **Kimlik Bilgilerini Yapılandırma**:
   - `src/utils/emailService.ts` dosyasını açın
   - Aşağıdaki değerleri kendi bilgilerinizle güncelleyin:
     ```javascript
     export const GMAIL_CONFIG = {
       CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
       CLIENT_SECRET: 'YOUR_CLIENT_SECRET',
       REDIRECT_URI: 'http://localhost:3000',
       SCOPE: ['https://www.googleapis.com/auth/gmail.send']
     };
     ```

## Kullanım

1. Kullanıcı adınızla giriş yapın
2. Stok sayımı yapmak için sol paneldeki sayım araçlarını kullanın:
   - Sayılacak miktarı girin
   - Barkod numarasını girin
3. Sayılan ürünler sağ panelde listelenir
4. Kayıtları güncellemek veya silmek için her satırın sonundaki işlem butonlarını kullanın
5. Raporu Excel olarak indirmek için "Excel'e Aktar" butonunu kullanın
6. Raporu e-posta ile göndermek için:
   - "E-posta ile Gönder" butonuna tıklayın
   - Alıcı e-posta adresini girin
   - "Gönder" butonuna tıklayın
   - Google hesabınızla giriş yapın ve uygulamaya izin verin
   - Rapor otomatik olarak gönderilecektir

## Gmail API Notları

- E-posta gönderimi tamamen kendi Gmail hesabınız üzerinden yapılır
- Kimlik bilgileri veya şifreler hiçbir üçüncü parti servise gönderilmez
- İlk kullanımda, Google'ın OAuth izin ekranı görüntülenecektir
- Uygulama, sadece e-posta gönderme izni ister, e-postaları okuma veya silme izni istemez

## Lisans

Bu proje [MIT lisansı](LICENSE) altında lisanslanmıştır.

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
# depov2
# sayimv2
