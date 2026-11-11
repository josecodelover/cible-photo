package fr.jose.ciblephoto;

import android.Manifest;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final int REQ_FILE = 1, REQ_CAM_PERM = 2;
    private WebView web;
    private ValueCallback<Uri[]> pending;   // réponse attendue par <input type=file>
    private Uri cameraUri;                  // photo en cours de prise par l'appareil photo du téléphone
    private PermissionRequest camRequest;   // demande de caméra de la page (visée intégrée)

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.parseColor("#1d3b2a"));
        getWindow().setNavigationBarColor(Color.parseColor("#eef2ef"));

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#eef2ef"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                   // localStorage : feuille de marque
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);   // l'aperçu caméra démarre seul
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new Chrome(this));
        setContentView(web);

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl("file:///android_asset/index.html");
    }

    /* Classe statique nommée (et non anonyme) : avec un JDK 21, javac ajoute aux classes anonymes
       un attribut que le d8 des build-tools 34 ne sait pas lire. */
    private static final class Chrome extends WebChromeClient {
        private final MainActivity a;
        Chrome(MainActivity activity) { a = activity; }

        /* Visée intégrée : la page demande la caméra (getUserMedia). */
        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            a.runOnUiThread(() -> {
                boolean video = false;
                for (String r : request.getResources())
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) video = true;
                if (!video) { request.deny(); return; }
                if (a.checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                    request.grant(new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
                } else {
                    a.camRequest = request;
                    a.requestPermissions(new String[] { Manifest.permission.CAMERA }, REQ_CAM_PERM);
                }
            });
        }

        /* <input type=file> : appareil photo du téléphone (capture) ou galerie. */
        @Override
        public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
            if (a.pending != null) a.pending.onReceiveValue(null);
            a.pending = cb;
            a.cameraUri = null;
            try {
                if (p.isCaptureEnabled() && Build.VERSION.SDK_INT >= 29) {
                    // La photo est écrite dans la galerie : pas besoin de FileProvider.
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Images.Media.DISPLAY_NAME, "cible_" + System.currentTimeMillis() + ".jpg");
                    cv.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                    a.cameraUri = a.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                    Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    i.putExtra(MediaStore.EXTRA_OUTPUT, a.cameraUri);
                    i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    a.startActivityForResult(i, REQ_FILE);
                } else {
                    Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("image/*");
                    a.startActivityForResult(Intent.createChooser(i, "Choisir une photo"), REQ_FILE);
                }
            } catch (Exception e) {
                a.dropCameraUri();
                a.pending.onReceiveValue(null);
                a.pending = null;
                Toast.makeText(a, "Impossible d'ouvrir l'appareil photo ou la galerie", Toast.LENGTH_LONG).show();
            }
            return true;
        }
    }

    private void dropCameraUri() {
        if (cameraUri != null) {
            try { getContentResolver().delete(cameraUri, null, null); } catch (Exception ignored) { }
            cameraUri = null;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE || pending == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK) {
            if (cameraUri != null) result = new Uri[] { cameraUri };
            else if (data != null && data.getData() != null) result = new Uri[] { data.getData() };
        } else {
            dropCameraUri();   // prise de vue annulée : on retire l'entrée vide de la galerie
        }
        cameraUri = null;
        pending.onReceiveValue(result);
        pending = null;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode != REQ_CAM_PERM || camRequest == null) return;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED)
            camRequest.grant(new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
        else camRequest.deny();   // la page se rabat alors sur l'appareil photo du téléphone
        camRequest = null;
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    /* Bouton retour : la page décide (analyse -> accueil), sinon on quitte. */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.androidBack ? androidBack() : false", result -> {
            if (!"true".equals(result)) MainActivity.super.onBackPressed();
        });
    }
}
