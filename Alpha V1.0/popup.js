// ===== OTOMATİK KAYDET KONTROLLERİ =====
document.addEventListener('DOMContentLoaded', async function() {
    // ... mevcut kodların devamı ...
    
    // OTOMATİK KAYDET ELEMENTLERİ
    const autoSaveToggle = document.getElementById('autoSaveToggle');
    const intervalOptions = document.getElementById('intervalOptions');
    const saveInterval = document.getElementById('saveInterval');
    const nextSaveTime = document.getElementById('nextSaveTime');
    
    // Otomatik kaydet ayarlarını yükle
    loadAutoSaveSettings();
    
    // Toggle değiştiğinde
    autoSaveToggle.addEventListener('change', function() {
        const enabled = this.checked;
        intervalOptions.style.display = enabled ? 'block' : 'none';
        
        // Background'a bildir
        chrome.runtime.sendMessage({
            action: 'updateAutoSave',
            enabled: enabled,
            interval: parseInt(saveInterval.value)
        });
        
        // Ayarları kaydet
        chrome.storage.local.set({
            autoSaveEnabled: enabled,
            saveInterval: parseInt(saveInterval.value)
        });
        
        updateNextSaveTime();
    });
    
    // Interval değiştiğinde
    saveInterval.addEventListener('change', function() {
        if (autoSaveToggle.checked) {
            chrome.runtime.sendMessage({
                action: 'updateAutoSave',
                enabled: true,
                interval: parseInt(this.value)
            });
            
            chrome.storage.local.set({
                saveInterval: parseInt(this.value)
            });
            
            updateNextSaveTime();
        }
    });
    
    // Ayarları yükle
    async function loadAutoSaveSettings() {
        const response = await chrome.runtime.sendMessage({ 
            action: 'getAutoSaveStatus' 
        });
        
        autoSaveToggle.checked = response.enabled;
        saveInterval.value = response.interval;
        intervalOptions.style.display = response.enabled ? 'block' : 'none';
        
        updateNextSaveTime();
    }
    
    // Sonraki kayıt zamanını güncelle
    function updateNextSaveTime() {
        if (autoSaveToggle.checked) {
            const interval = parseInt(saveInterval.value);
            const now = new Date();
            const nextTime = new Date(now.getTime() + interval * 60000);
            nextSaveTime.textContent = nextTime.toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            nextSaveTime.textContent = '-';
        }
    }
    
    // Her dakika sonraki kayıt zamanını güncelle
    setInterval(updateNextSaveTime, 60000);
});