document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const video = document.getElementById('camera');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('capture');
    const downloadBtn = document.getElementById('download');
    const retakeBtn = document.getElementById('retake');
    const photosContainer = document.getElementById('photos');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const flash = document.querySelector('.flash');
    const countdown = document.getElementById('countdown');
    const collageBtn = document.getElementById('collage');
    const collagePreview = document.getElementById('collage-preview');
    const collageContainer = document.getElementById('collage-container');
    const finishCollageBtn = document.getElementById('finish-collage');
    const cancelCollageBtn = document.getElementById('cancel-collage');
    const modeOptions = document.querySelectorAll('input[name="mode"]');
    const flipBtn = document.getElementById('flip-btn');
    
    // Variables
    const context = canvas.getContext('2d');
    let currentFilter = 'normal';
    let currentStream = null;
    let photosTaken = [];
    let collagePhotos = [];
    let collageMode = 'single'; // single, collage_2x2, strip, side_by_side
    let isFlipped = true; // Mặc định là lật ảnh (mirror)
    
    // Khởi động camera
    async function startCamera() {
        // Nếu đã có stream và đang hoạt động, không cần xin lại quyền
        if (currentStream && currentStream.active) {
            video.play();
            return;
        }

        try {
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            currentStream = stream;
            
            video.onloadedmetadata = () => {
                video.play();
                captureBtn.disabled = false;
                downloadBtn.disabled = true;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            };
            
        } catch (err) {
            console.error('Lỗi khi truy cập camera:', err);
            // Chỉ alert nếu thực sự lỗi, tránh spam khi refresh
            if (err.name !== 'NotAllowedError' && err.name !== 'NotFoundError') {
                alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập!');
            }
        }
    }
    
    startCamera();

    // Flip Camera Logic
    flipBtn.addEventListener('click', () => {
        isFlipped = !isFlipped;
        // Update video preview transform
        video.style.transform = isFlipped ? 'scaleX(-1)' : 'none';
    });

    // Event Listeners
    captureBtn.addEventListener('click', capturePhoto);
    
    retakeBtn.addEventListener('click', () => {
        // Reset UI
        retakeBtn.style.display = 'none';
        captureBtn.style.display = 'block';
        downloadBtn.disabled = true;
        
        // Không gọi startCamera() lại từ đầu để tránh hỏi quyền
        // Chỉ cần play lại video nếu nó bị pause
        video.play();
        
        // Clear single photo preview if needed (optional, logic handled in displayPhotos)
    });

    // Filter selection
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            video.className = ''; 
            if (currentFilter !== 'normal') {
                video.classList.add(`filter-${currentFilter}`);
            }
        });
    });

    // Mode selection
    modeOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            collageMode = e.target.value;
            collagePhotos = [];
            collagePreview.style.display = 'none';
            
            // Reset UI states
            captureBtn.disabled = false;
            captureBtn.style.display = 'block';
            retakeBtn.style.display = 'none';
            downloadBtn.disabled = true;
            video.play();
        });
    });

    if (finishCollageBtn) {
        finishCollageBtn.addEventListener('click', () => createCollage());
    }

    if (cancelCollageBtn) {
        cancelCollageBtn.addEventListener('click', () => {
            collagePhotos = [];
            collagePreview.style.display = 'none';
            captureBtn.disabled = false;
            video.play();
        });
    }

    function startCountdown() {
        return new Promise((resolve) => {
            countdown.textContent = '3';
            countdown.classList.add('active');
            let count = 3;
            const countInterval = setInterval(() => {
                count--;
                if (count > 0) {
                    countdown.textContent = count.toString();
                } else {
                    clearInterval(countInterval);
                    countdown.classList.remove('active');
                    resolve();
                }
            }, 1000);
        });
    }
    
    // Hàm thêm khung đẹp cho ảnh đơn
    function addFrameToPhoto(imgData) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Config
                const frameColor = '#fff0f5'; // Lavender blush
                const borderColor = '#ffb7b2'; // Pastel red/pink
                const padding = 40;
                const bottomPadding = 80; // Space for text
                
                canvas.width = img.width + (padding * 2);
                canvas.height = img.height + padding + bottomPadding;
                
                // Draw Frame Background
                ctx.fillStyle = frameColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw Image
                ctx.drawImage(img, padding, padding);
                
                // Draw Border around image
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 4;
                ctx.strokeRect(padding - 5, padding - 5, img.width + 10, img.height + 10);
                
                // Add Watermark/Text
                ctx.font = 'bold 30px "Fredoka One", cursive';
                ctx.fillStyle = '#ff6b6b';
                ctx.textAlign = 'center';
                ctx.fillText("c.nhoa's Booth", canvas.width / 2, canvas.height - 30);
                
                // Add Date
                ctx.font = '16px "Varela Round", sans-serif';
                ctx.fillStyle = '#888';
                const date = new Date().toLocaleDateString('vi-VN');
                ctx.fillText(date, canvas.width / 2, canvas.height - 10);
                
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = imgData;
        });
    }
    
    async function capturePhoto() {
        if (collageMode !== 'single' && collagePhotos.length >= getRequiredPhotos()) return;

        captureBtn.disabled = true;
        await startCountdown();
        
        flash.classList.add('active');
        setTimeout(() => flash.classList.remove('active'), 500);
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Handle Flip
        context.save();
        if (isFlipped) {
            context.scale(-1, 1);
            context.translate(-canvas.width, 0);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.restore();
        
        // Apply Filter
        if (currentFilter !== 'normal') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0);
            
            // Get filter string from video element computed style
            // Note: This approximates the CSS filter. For better results, we might need manual canvas manipulation.
            // But for simple filters, this trick works if supported or we just stick to CSS classes for display
            // and simple overlay/color manipulation for canvas.
            // Since we want to keep it simple and robust:
            // We will apply a simple overlay for specific filters if needed, 
            // but `context.filter` is supported in modern browsers.
            context.filter = getComputedStyle(video).filter;
            context.drawImage(tempCanvas, 0, 0);
            context.filter = 'none';
        }
        
        const imgData = canvas.toDataURL('image/png');
        
        if (collageMode === 'single') {
            const framedImgData = await addFrameToPhoto(imgData);
            
            photosTaken.push({ src: framedImgData });
            displayPhotos();
            
            downloadBtn.disabled = false;
            retakeBtn.style.display = 'block';
            captureBtn.style.display = 'none';
            video.pause();
            
        } else {
            // Collage Mode
            collagePhotos.push({ src: imgData });
            updateCollagePreview();
            
            if (collagePhotos.length >= getRequiredPhotos()) {
                createCollage();
            } else {
                captureBtn.disabled = false; // Allow next photo
            }
        }
    }
    
    function getRequiredPhotos() {
        if (collageMode === 'collage_2x2') return 4;
        if (collageMode === 'strip') return 4; // Vertical strip usually 3 or 4
        if (collageMode === 'side_by_side') return 2;
        return 1;
    }

    function displayPhotos() {
        photosContainer.innerHTML = '';
        photosTaken.forEach((photo, index) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'photo-item';
            const img = document.createElement('img');
            img.src = photo.src;
            
            const overlay = document.createElement('div');
            overlay.className = 'photo-overlay';
            
            const dBtn = document.createElement('button');
            dBtn.className = 'download-btn';
            dBtn.innerHTML = '<i class="fas fa-download"></i>';
            dBtn.onclick = () => {
                const link = document.createElement('a');
                link.download = `cnhoa-booth-${Date.now()}.png`;
                link.href = photo.src;
                link.click();
            };
            
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            delBtn.onclick = () => {
                if(confirm('Xóa ảnh này?')) {
                    photosTaken.splice(index, 1);
                    displayPhotos();
                }
            };
            
            overlay.appendChild(dBtn);
            overlay.appendChild(delBtn);
            photoDiv.appendChild(img);
            photoDiv.appendChild(overlay);
            photosContainer.appendChild(photoDiv);
        });
    }

    function updateCollagePreview() {
        collageContainer.innerHTML = '';
        const required = getRequiredPhotos();
        
        // Adjust grid for preview
        if (collageMode === 'strip') {
            collageContainer.style.gridTemplateColumns = '1fr';
        } else if (collageMode === 'side_by_side') {
            collageContainer.style.gridTemplateColumns = '1fr 1fr';
        } else {
            collageContainer.style.gridTemplateColumns = '1fr 1fr';
        }
        
        for (let i = 0; i < required; i++) {
            const cell = document.createElement('div');
            cell.className = 'collage-item';
            if (i < collagePhotos.length) {
                const img = document.createElement('img');
                img.src = collagePhotos[i].src;
                cell.appendChild(img);
            } else {
                cell.classList.add('empty');
                cell.innerHTML = `<span>${i + 1}</span>`;
            }
            collageContainer.appendChild(cell);
        }
        collagePreview.style.display = 'block';
    }

    // Unified Collage Creator
    function createCollage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Base config
        const padding = 30;
        const gap = 20;
        const headerHeight = 0; // No header for now, maybe footer
        const footerHeight = 100;
        const bg = '#fff0f5'; // Lavender blush
        
        // Load all images first
        const images = collagePhotos.map(p => {
            const img = new Image();
            img.src = p.src;
            return img;
        });
        
        // Wait for all to load (though src is dataURL so it's fast, better safe)
        let loadedCount = 0;
        images.forEach(img => {
            img.onload = () => {
                loadedCount++;
                if (loadedCount === images.length) {
                    drawCollage(canvas, ctx, images, padding, gap, footerHeight, bg);
                }
            };
        });
    }

    function drawCollage(canvas, ctx, images, padding, gap, footerHeight, bg) {
        // Determine layout dimensions
        const imgW = images[0].width;
        const imgH = images[0].height;
        
        let finalW, finalH;
        
        if (collageMode === 'collage_2x2') {
            // 2 columns, 2 rows
            finalW = (imgW * 2) + (padding * 2) + gap;
            finalH = (imgH * 2) + (padding * 2) + gap + footerHeight;
            
            canvas.width = finalW;
            canvas.height = finalH;
            
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, finalW, finalH);
            
            // Draw images
            images.forEach((img, i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const x = padding + (col * (imgW + gap));
                const y = padding + (row * (imgH + gap));
                ctx.drawImage(img, x, y, imgW, imgH);
            });
            
        } else if (collageMode === 'strip') {
            // 1 column, 4 rows (Vertical Strip)
            // Scale down images slightly for strip to not be huge
            const scale = 0.8;
            const sW = imgW * scale;
            const sH = imgH * scale;
            
            finalW = sW + (padding * 2);
            finalH = (sH * 4) + (padding * 2) + (gap * 3) + footerHeight;
            
            canvas.width = finalW;
            canvas.height = finalH;
            
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, finalW, finalH);
            
            images.forEach((img, i) => {
                const x = padding;
                const y = padding + (i * (sH + gap));
                ctx.drawImage(img, x, y, sW, sH);
            });
            
        } else if (collageMode === 'side_by_side') {
            // 2 columns, 1 row
            finalW = (imgW * 2) + (padding * 2) + gap;
            finalH = imgH + (padding * 2) + footerHeight;
            
            canvas.width = finalW;
            canvas.height = finalH;
            
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, finalW, finalH);
            
            images.forEach((img, i) => {
                const x = padding + (i * (imgW + gap));
                const y = padding;
                ctx.drawImage(img, x, y, imgW, imgH);
            });
        }
        
        // Draw Footer Text
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 40px "Fredoka One", cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const footerCenterY = canvas.height - (footerHeight / 2);
        ctx.fillText("c.nhoa's Booth", canvas.width / 2, footerCenterY - 10);
        
        ctx.fillStyle = '#888';
        ctx.font = '20px "Varela Round", sans-serif';
        const date = new Date().toLocaleDateString('vi-VN');
        ctx.fillText(date, canvas.width / 2, footerCenterY + 25);
        
        // Finish
        const finalImg = canvas.toDataURL('image/png');
        photosTaken.push({ src: finalImg });
        displayPhotos();
        
        // Reset
        collagePhotos = [];
        collagePreview.style.display = 'none';
        document.querySelector('input[value="single"]').checked = true;
        collageMode = 'single';
        captureBtn.disabled = false;
        captureBtn.style.display = 'block';
        retakeBtn.style.display = 'none';
        video.play();
    }
});