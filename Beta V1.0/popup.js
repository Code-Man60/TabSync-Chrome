// TabSync - TAM VERSİYON
document.addEventListener('DOMContentLoaded', async function() {
    const saveBtn = document.getElementById('saveBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const clearBtn = document.getElementById('clearBtn');
    const status = document.getElementById('status');
    const counter = document.getElementById('counter');
    const lastSaved = document.getElementById('lastSaved');
    
    // Sayfa açılınca kayıtlı sekmeleri kontrol et
    updateUI();
    
    // ===== 1. KAYDET BUTONU =====
    saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '⏳ Kaydediliyor...';
        
        try {
            // Tüm sekmeleri al
            const tabs = await chrome.tabs.query({});
            
            // Aktif sekmeleri filtrele
            const validTabs = tabs.filter(tab => 
                tab.url && 
                !tab.url.startsWith('chrome://') && 
                !tab.url.startsWith('chrome-extension://')
            );
            
            // Sekme verilerini hazırla
            const tabsData = validTabs.map(tab => ({
                title: tab.title || 'Başlıksız Sekme',
                url: tab.url,
                favIconUrl: tab.favIconUrl || '',
                id: tab.id
            }));
            
            // Kayıt zamanı
            const now = new Date();
            const saveData = {
                tabs: tabsData,
                savedAt: now.toLocaleString('tr-TR'),
                timestamp: now.getTime(),
                totalTabs: tabsData.length,
                version: '1.0'
            };
            
            // Chrome storage'a kaydet
            await chrome.storage.local.set({ 
                'lastSavedTabs': saveData 
            });
            
            // Başarı mesajı
            showStatus(`✅ ${tabsData.length} sekme kaydedildi!`, 'success');
            updateUI();
            
        } catch (error) {
            showStatus(`❌ Hata: ${error.message}`, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '💾 SEKMELERİ KAYDET';
        }
    });
    
    // ===== 2. GERİ YÜKLE BUTONU =====
    restoreBtn.addEventListener('click', async () => {
        restoreBtn.disabled = true;
        restoreBtn.innerHTML = '⏳ Yükleniyor...';
        
        try {
            // Kayıtlı sekmeleri al
            const result = await chrome.storage.local.get(['lastSavedTabs']);
            
            if (!result.lastSavedTabs || !result.lastSavedTabs.tabs) {
                showStatus('❌ Kayıtlı sekme bulunamadı!', 'error');
                return;
            }
            
            const savedTabs = result.lastSavedTabs.tabs;
            let restoredCount = 0;
            
            // Her kayıtlı sekme için yeni sekme aç
            for (const tab of savedTabs) {
                if (tab.url && tab.url.trim() !== '') {
                    await chrome.tabs.create({ url: tab.url });
                    restoredCount++;
                }
            }
            
            showStatus(`✅ ${restoredCount} sekme geri yüklendi!`, 'success');
            
        } catch (error) {
            showStatus(`❌ Geri yükleme hatası: ${error.message}`, 'error');
        } finally {
            restoreBtn.disabled = false;
            restoreBtn.innerHTML = '🔄 KAYDI GERİ YÜKLE';
        }
    });
    
    // ===== 3. TEMİZLE BUTONU =====
    clearBtn.addEventListener('click', async () => {
        if (confirm('Tüm kayıtlı sekmeler silinsin mi?')) {
            await chrome.storage.local.remove(['lastSavedTabs']);
            showStatus('🗑️ Tüm kayıtlar temizlendi!', 'info');
            updateUI();
        }
    });
    
    // ===== YARDIMCI FONKSİYONLAR =====
    
    function showStatus(message, type) {
        status.textContent = message;
        status.className = type;
        status.style.display = 'block';
        
        // 4 saniye sonra gizle
        setTimeout(() => {
            status.style.display = 'none';
        }, 4000);
    }
    
    async function updateUI() {
        try {
            const result = await chrome.storage.local.get(['lastSavedTabs']);
            
            if (result.lastSavedTabs) {
                const tabCount = result.lastSavedTabs.totalTabs || 0;
                const savedTime = result.lastSavedTabs.savedAt || '';
                
                counter.textContent = `${tabCount} sekme kayıtlı`;
                lastSaved.textContent = `Son kayıt: ${savedTime}`;
                
                restoreBtn.disabled = false;
                clearBtn.disabled = false;
            } else {
                counter.textContent = '0 sekme kayıtlı';
                lastSaved.textContent = 'Son kayıt: Yok';
                
                restoreBtn.disabled = true;
                clearBtn.disabled = true;
            }
        } catch (error) {
            console.error('UI güncelleme hatası:', error);
        }
    }
    
    // İlk yüklemede UI'ı güncelle
    updateUI();
});