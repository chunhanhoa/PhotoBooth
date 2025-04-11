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
    const stickerBtns = document.querySelectorAll('.sticker-btn');
    const stickersPreview = document.getElementById('stickers-preview');
    
    // Thêm nút lật ảnh nếu chưa có trong HTML
    let flipButton;
    if (document.getElementById('flip')) {
        flipButton = document.getElementById('flip');
    } else {
        flipButton = document.createElement('button');
        flipButton.id = 'flip';
        flipButton.className = 'btn btn-secondary';
        flipButton.innerHTML = '<i class="fas fa-sync-alt"></i> Lật ảnh';
        document.querySelector('.controls').insertBefore(flipButton, collageBtn);
    }
    
    // Variables
    const context = canvas.getContext('2d');
    let currentFilter = 'normal';
    let currentStream = null;
    let photosTaken = [];
    let collagePhotos = [];
    let collageMode = 'single'; // single, collage_2x2, collage_3x3, strip, side_by_side
    let activeStickers = [];
    let isDraggingSticker = false;
    let draggedSticker = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let isFlipped = true; // Mặc định là lật ảnh
    let firstCameraLoad = true; // Thêm biến toàn cục để kiểm soát tooltip
    
    // Khởi động camera với cấu hình cải thiện
    async function startCamera() {
        try {
            // Kiểm tra nếu là thiết bị mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // Kiểm tra hướng màn hình (portrait/landscape)
            const isPortrait = window.innerHeight > window.innerWidth;
            
            // Thiết lập cấu hình camera cải tiến
            const constraints = {
                video: {
                    facingMode: 'user',
                    // Đặt kích thước phù hợp để thấy được nhiều hơn (từ thân người trở lên)
                    width: { ideal: isMobile ? (isPortrait ? 720 : window.innerWidth) : 1280 },
                    // Giảm chiều cao cho portrait mode để giảm zoom, tăng cho landscape
                    height: { ideal: isMobile ? (isPortrait ? 1280 : window.innerHeight) : 720 }
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            currentStream = stream;
            captureBtn.disabled = false;
            downloadBtn.disabled = true;
            
            // Đặt kích thước canvas bằng với video
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                video.classList.add(`filter-${currentFilter}`);
                
                // Áp dụng trạng thái lật ảnh
                if (isFlipped) {
                    video.style.transform = 'scaleX(-1)';
                } else {
                    video.style.transform = 'scaleX(1)';
                }
                
                // Điều chỉnh hiển thị video trên mobile để thấy nhiều hơn
                if (isMobile) {
                    // Đảm bảo hiển thị toàn bộ feed camera thay vì zoom in
                    video.style.objectFit = 'contain';
                    // Thêm CSS để hiển thị khung hình đẹp hơn
                    video.style.width = '100%';
                    video.style.height = '100%';
                    
                    // Điều chỉnh zoom mặc định trên mobile để thấy được nhiều hơn
                    if (isPortrait) {
                        // Đảm bảo camera hiển thị rõ hơn trên chế độ dọc
                        video.style.transform += ' scale(0.85)';
                        
                        // Cập nhật biến scale nếu đang sử dụng zoom
                        if (typeof scale !== 'undefined') {
                            scale = 0.85;
                        }
                    }
                    
                    // Hiển thị thông báo để người dùng biết có nút thu phóng
                    if (firstCameraLoad) {
                        setTimeout(() => {
                            const tooltip = document.createElement('div');
                            tooltip.className = 'camera-tooltip';
                            tooltip.innerHTML = 'Sử dụng nút + và - để điều chỉnh zoom';
                            tooltip.style.cssText = `
                                position: absolute;
                                bottom: 60px;
                                right: 10px;
                                background: rgba(255,255,255,0.8);
                                padding: 8px 12px;
                                border-radius: 20px;
                                font-size: 12px;
                                color: var(--primary-color);
                                z-index: 100;
                            `;
                            document.querySelector('.camera-container').appendChild(tooltip);
                            
                            // Tự động ẩn tooltip sau 5 giây
                            setTimeout(() => tooltip.remove(), 5000);
                        }, 2000);
                        firstCameraLoad = false;
                    }
                }
            };
            
        } catch (err) {
            console.error('Lỗi khi truy cập camera:', err);
            
            // Thông báo thân thiện hơn trên mobile
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera và làm mới trang.');
            } else {
                alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập và thử lại!');
            }
        }
    }
    
    // Hàm đếm ngược
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
    function addFrameToPhoto(imgData, filter) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // Tạo canvas cho ảnh có khung
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Tính toán kích thước thực tế của khung
                const frameMargin = 40; // khoảng cách khung đến viền
                const borderWidth = 15;  // độ dày viền ngoài
                const innerBorderWidth = 3; // độ dày viền trong
                
                // Giữ nguyên tỷ lệ ảnh
                const aspectRatio = img.width / img.height;
                let canvasWidth, canvasHeight;
                
                if (aspectRatio >= 1) {
                    // Ảnh ngang hoặc vuông
                    canvasWidth = Math.min(1200, img.width + frameMargin * 2);
                    canvasHeight = canvasWidth / aspectRatio;
                } else {
                    // Ảnh dọc
                    canvasHeight = Math.min(1200, img.height + frameMargin * 2);
                    canvasWidth = canvasHeight * aspectRatio;
                }
                
                // Thêm lề cho khung
                canvas.width = canvasWidth + frameMargin * 2;
                canvas.height = canvasHeight + frameMargin * 2;
                
                // Vẽ nền màu pastel
                ctx.fillStyle = '#ffeaf7';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Vẽ khung ngoài với gradient
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#ff9ed4');
                gradient.addColorStop(0.5, '#ffb6e1');
                gradient.addColorStop(1, '#ff9ed4');
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = borderWidth;
                ctx.strokeRect(borderWidth/2, borderWidth/2, 
                               canvas.width - borderWidth, canvas.height - borderWidth);
                
                // Vẽ khung trong
                ctx.strokeStyle = 'white';
                ctx.lineWidth = innerBorderWidth;
                ctx.strokeRect(frameMargin/2, frameMargin/2, 
                               canvas.width - frameMargin, canvas.height - frameMargin);
                
                // Vẽ ảnh vào giữa khung - đảm bảo giữ nguyên tỷ lệ và vừa khít
                const imageWidth = canvas.width - frameMargin * 2;
                const imageHeight = canvas.height - frameMargin * 2;
                ctx.drawImage(img, frameMargin, frameMargin, imageWidth, imageHeight);
                
                // Thêm ngày tháng
                ctx.font = 'bold 16px Quicksand, sans-serif';
                ctx.fillStyle = '#ff6eb5';
                ctx.textAlign = 'right';
                
                const today = new Date();
                const dateStr = today.toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                ctx.fillText(dateStr, canvas.width - 25, canvas.height - 25);
                
                // Thêm nhãn PhotoBooth
                ctx.font = 'italic 14px Quicksand, sans-serif';
                ctx.fillStyle = 'rgba(255, 110, 181, 0.7)';
                ctx.textAlign = 'left';
                ctx.fillText('PhotoBooth', 25, canvas.height - 25);
                
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = imgData;
        });
    }
    
    // Chức năng chụp ảnh với thêm khung (thay thế phần chụp ảnh đơn)
    async function capturePhoto() {
        captureBtn.disabled = true;
        
        // Đếm ngược 3 giây
        await startCountdown();
        
        // Tạo hiệu ứng flash
        flash.classList.add('active');
        setTimeout(() => flash.classList.remove('active'), 500);
        
        // Chụp ảnh từ video
        canvas.width = video.videoWidth || video.clientWidth;
        canvas.height = video.videoHeight || video.clientHeight;
        
        context.save();
        
        // Xử lý lật ảnh dựa vào trạng thái isFlipped
        if (isFlipped) {
            // Lật ảnh ngang
            context.scale(-1, 1);
            context.translate(-canvas.width, 0);
        }
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Áp dụng bộ lọc vào canvas
        if (currentFilter !== 'normal') {
            const filterStyle = getComputedStyle(video).filter;
            context.filter = filterStyle;
            context.drawImage(canvas, 0, 0);
            context.filter = 'none';
        }
        
        // Vẽ stickers lên canvas - đảm bảo vị trí đúng khi lật ảnh
        if (isFlipped) {
            // Khi ảnh bị lật, cần điều chỉnh vị trí sticker
            activeStickers.forEach(sticker => {
                const img = document.getElementById(`sticker-img-${sticker.id}`);
                if (img) {
                    const adjustedX = canvas.width - sticker.x - sticker.width;
                    context.drawImage(
                        img,
                        adjustedX,
                        sticker.y,
                        sticker.width,
                        sticker.height
                    );
                }
            });
        } else {
            // Khi ảnh không bị lật
            drawStickersOnCanvas();
        }
        
        context.restore();
        
        // Chuyển đổi sang base64 và lưu
        const imgData = canvas.toDataURL('image/png');
        
        if (collageMode === 'single') {
            // Thêm khung đẹp cho ảnh đơn
            const framedImgData = await addFrameToPhoto(imgData, currentFilter);
            
            photosTaken.push({
                src: framedImgData,
                filter: currentFilter,
                date: new Date().toISOString(),
                isFramed: true
            });
            
            // Hiển thị ảnh đã chụp
            displayPhotos();
            
            // Hiển thị nút tải xuống và chụp lại
            downloadBtn.disabled = false;
            retakeBtn.style.display = 'block';
            captureBtn.style.display = 'none';
        } else if (collageMode === 'side_by_side') {
            // Xử lý chế độ chụp 2 ảnh song song
            collagePhotos.push({
                src: imgData,
                filter: currentFilter
            });
            
            if (collagePhotos.length === 2) {
                createSideBySideImage();
            } else {
                captureBtn.disabled = false;
                updateCollagePreview();
            }
        } else {
            // Thêm vào bộ sưu tập collage
            collagePhotos.push({
                src: imgData,
                filter: currentFilter
            });
            
            // Nếu đã đủ số lượng ảnh cho collage
            if ((collageMode === 'collage_2x2' && collagePhotos.length === 4) || 
                (collageMode === 'collage_3x3' && collagePhotos.length === 9) || 
                (collageMode === 'strip' && collagePhotos.length === 4)) {
                
                createCollage();
            } else {
                // Tiếp tục chụp nếu chưa đủ
                captureBtn.disabled = false;
                updateCollagePreview();
            }
        }
    }
    
    // Vẽ stickers lên canvas
    function drawStickersOnCanvas() {
        activeStickers.forEach(sticker => {
            const img = document.getElementById(`sticker-img-${sticker.id}`);
            if (img) {
                context.drawImage(
                    img,
                    sticker.x,
                    sticker.y,
                    sticker.width,
                    sticker.height
                );
            }
        });
    }
    
    // Thêm sticker vào preview
    function addSticker(stickerName) {
        const stickerId = Date.now();
        const stickerDiv = document.createElement('div');
        stickerDiv.className = 'sticker';
        stickerDiv.id = `sticker-${stickerId}`;
        stickerDiv.style.top = '50px';
        stickerDiv.style.left = '50px';
        
        const img = document.createElement('img');
        img.src = `stickers/${stickerName}.png`;
        img.id = `sticker-img-${stickerId}`;
        img.draggable = false; // Prevent default drag behavior
        
        // Tạo các nút điều khiển sticker
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'sticker-controls';
        
        // Nút tăng kích thước
        const increaseBtn = document.createElement('button');
        increaseBtn.className = 'sticker-btn-control sticker-increase';
        increaseBtn.innerHTML = '<i class="fas fa-plus"></i>';
        increaseBtn.title = 'Tăng kích thước';
        
        // Nút giảm kích thước
        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'sticker-btn-control sticker-decrease';
        decreaseBtn.innerHTML = '<i class="fas fa-minus"></i>';
        decreaseBtn.title = 'Giảm kích thước';
        
        // Nút xóa sticker
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'sticker-btn-control sticker-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Xóa sticker';
        
        // Thêm nút vào div điều khiển
        controlsDiv.appendChild(increaseBtn);
        controlsDiv.appendChild(decreaseBtn);
        controlsDiv.appendChild(deleteBtn);
        
        // Load image and get original dimensions
        img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const stickerWidth = 100;
            const stickerHeight = stickerWidth / aspectRatio;
            
            stickerDiv.style.width = stickerWidth + 'px';
            stickerDiv.style.height = stickerHeight + 'px';
            
            // Add sticker to active stickers array
            activeStickers.push({
                id: stickerId,
                name: stickerName,
                x: 50,
                y: 50,
                width: stickerWidth,
                height: stickerHeight,
                aspectRatio: aspectRatio
            });
        };
        
        // Thêm sự kiện cho nút tăng kích thước
        increaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resizeSticker(stickerId, 1.2); // Tăng kích thước lên 20%
        });
        
        // Thêm sự kiện cho nút giảm kích thước
        decreaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resizeSticker(stickerId, 0.8); // Giảm kích thước 20%
        });
        
        // Thêm sự kiện cho nút xóa
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSticker(stickerId);
        });
        
        stickerDiv.appendChild(img);
        stickerDiv.appendChild(controlsDiv);
        
        // Make sticker draggable
        stickerDiv.addEventListener('mousedown', (e) => {
            // Không kích hoạt kéo thả nếu đang nhấn vào nút điều khiển
            if (e.target.closest('.sticker-btn-control')) return;
            
            isDraggingSticker = true;
            draggedSticker = stickerDiv;
            const rect = draggedSticker.getBoundingClientRect();
            dragStartX = e.clientX - rect.left;
            dragStartY = e.clientY - rect.top;
            
            // Bring to front
            stickersPreview.appendChild(draggedSticker);
        });
        
        // THÊM MỚI: Hỗ trợ touch events cho mobile
        stickerDiv.addEventListener('touchstart', (e) => {
            // Không kích hoạt kéo thả nếu đang chạm vào nút điều khiển
            if (e.target.closest('.sticker-btn-control')) return;
            
            isDraggingSticker = true;
            draggedSticker = stickerDiv;
            
            const touch = e.touches[0];
            const rect = draggedSticker.getBoundingClientRect();
            dragStartX = touch.clientX - rect.left;
            dragStartY = touch.clientY - rect.top;
            
            // Bring to front
            stickersPreview.appendChild(draggedSticker);
            
            // Ngăn chặn scroll khi kéo sticker
            e.preventDefault();
        }, { passive: false });
        
        stickersPreview.appendChild(stickerDiv);
    }
    
    // Hàm thay đổi kích thước sticker
    function resizeSticker(stickerId, scale) {
        const stickerDiv = document.getElementById(`sticker-${stickerId}`);
        const stickerIndex = activeStickers.findIndex(s => s.id === stickerId);
        
        if (stickerDiv && stickerIndex !== -1) {
            const sticker = activeStickers[stickerIndex];
            
            // Tính toán kích thước mới
            const newWidth = Math.max(30, Math.min(300, sticker.width * scale));
            const newHeight = newWidth / sticker.aspectRatio;
            
            // Cập nhật kích thước trong DOM
            stickerDiv.style.width = newWidth + 'px';
            stickerDiv.style.height = newHeight + 'px';
            
            // Cập nhật kích thước trong mảng stickers
            activeStickers[stickerIndex].width = newWidth;
            activeStickers[stickerIndex].height = newHeight;
        }
    }
    
    // Hàm xóa sticker
    function deleteSticker(stickerId) {
        const stickerDiv = document.getElementById(`sticker-${stickerId}`);
        if (stickerDiv) {
            stickerDiv.remove();
        }
        
        // Xóa sticker khỏi mảng activeStickers
        const stickerIndex = activeStickers.findIndex(s => s.id === stickerId);
        if (stickerIndex !== -1) {
            activeStickers.splice(stickerIndex, 1);
        }
    }
    
    // Hiển thị ảnh đã chụp
    function displayPhotos() {
        photosContainer.innerHTML = '';
        
        photosTaken.forEach((photo, index) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'photo-item';
            
            const img = document.createElement('img');
            img.src = photo.src;
            img.alt = `Ảnh ${index + 1}`;
            img.classList.add(`filter-${photo.filter}`);
            
            const overlay = document.createElement('div');
            overlay.className = 'photo-overlay';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = () => deletePhoto(index);
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
            downloadBtn.onclick = (e) => {
                e.stopPropagation();
                downloadSinglePhoto(index);
            };
            
            overlay.appendChild(downloadBtn);
            overlay.appendChild(deleteBtn);
            
            photoDiv.appendChild(img);
            photoDiv.appendChild(overlay);
            photosContainer.appendChild(photoDiv);
        });
    }
    
    // Tạo và hiển thị collage preview
    function updateCollagePreview() {
        collageContainer.innerHTML = '';
        
        const totalCells = collageMode === 'collage_2x2' ? 4 : 
                           (collageMode === 'collage_3x3' ? 9 : 
                           (collageMode === 'side_by_side' ? 2 : 4));
                           
        const gridTemplate = collageMode === 'collage_3x3' ? 'repeat(3, 1fr)' : 
                            (collageMode === 'strip' ? '1fr' : 
                            (collageMode === 'side_by_side' ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)'));
        
        collageContainer.style.gridTemplateColumns = gridTemplate;
        
        // Điều chỉnh khoảng cách grid nhỏ hơn trên mobile
        const isMobile = window.innerWidth <= 480;
        collageContainer.style.gap = isMobile ? '5px' : '10px';
        
        if (collageMode === 'strip') {
            collageContainer.style.gridTemplateRows = 'repeat(4, 1fr)';
        }
        
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'collage-item';
            
            // Đặt tỷ lệ khía cạnh cho từng ô
            if (isMobile) {
                if (collageMode === 'strip') {
                    cell.style.aspectRatio = '4/3';
                    cell.style.minHeight = '60px';
                } else if (collageMode !== 'side_by_side') {
                    cell.style.aspectRatio = '1/1';
                    cell.style.minHeight = '60px';
                }
            }
            
            if (i < collagePhotos.length) {
                const img = document.createElement('img');
                img.src = collagePhotos[i].src;
                img.classList.add(`filter-${collagePhotos[i].filter}`);
                img.style.objectFit = 'cover';
                cell.appendChild(img);
            } else {
                cell.classList.add('empty');
            }
            
            collageContainer.appendChild(cell);
        }
        
        collagePreview.style.display = 'block';
    }
    
    // Tạo ảnh ghép 2 ảnh song song - thiết kế đồng bộ với ảnh đơn
    function createSideBySideImage() {
        const collageCanvas = document.createElement('canvas');
        const ctx = collageCanvas.getContext('2d');
        
        // Tạo canvas với kích thước cố định, đảm bảo tỷ lệ đẹp
        const canvasWidth = 1200;  // Chiều rộng cố định
        const canvasHeight = 600;  // Chiều cao cố định 
        const frameMargin = 40;    // Khoảng cách từ viền đến ảnh
        
        collageCanvas.width = canvasWidth;
        collageCanvas.height = canvasHeight;
        
        // Fill background với màu pastel
        ctx.fillStyle = '#ffeaf7';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Vẽ khung ngoài - giống chế độ đơn
        const outerBorderWidth = 15;
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        gradient.addColorStop(0, '#ff9ed4');
        gradient.addColorStop(0.5, '#ffb6e1');
        gradient.addColorStop(1, '#ff9ed4');
        
        ctx.lineWidth = outerBorderWidth;
        ctx.strokeStyle = gradient;
        ctx.strokeRect(outerBorderWidth/2, outerBorderWidth/2, 
                     canvasWidth - outerBorderWidth, canvasHeight - outerBorderWidth);
        
        // Vẽ khung thứ hai mỏng bên trong
        const innerBorderWidth = 3;
        ctx.lineWidth = innerBorderWidth;
        ctx.strokeStyle = 'white';
        ctx.strokeRect(frameMargin/2, frameMargin/2, 
                     canvasWidth - frameMargin, canvasHeight - frameMargin);
        
        // Tính toán khu vực cho mỗi ảnh
        const middleX = canvasWidth / 2;
        const imageAreaWidth = (canvasWidth - frameMargin * 2) / 2;
        const imageAreaHeight = canvasHeight - frameMargin * 2;
        
        // Vẽ đường phân cách ở giữa
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(middleX, frameMargin);
        ctx.lineTo(middleX, canvasHeight - frameMargin);
        ctx.stroke();
        
        // Vẽ từng ảnh vào đúng nửa của khung
        const promises = collagePhotos.map((photo, index) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    // Xác định vị trí và kích thước cho ảnh này
                    const x = index === 0 ? frameMargin : middleX + 1;  // +1px để tránh chồng lên đường phân cách
                    const areaWidth = imageAreaWidth - (index === 0 ? 2 : 1);  // Điều chỉnh để tránh đè lên đường phân cách
                    
                    // Vẽ khung cho mỗi ảnh
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#ffffff88';
                    const frameX = index === 0 ? frameMargin : middleX + 1;
                    ctx.strokeRect(frameX, frameMargin, areaWidth, imageAreaHeight);
                    
                    // Tính toán kích thước và vị trí để ảnh vừa khít vào khung
                    const aspectRatio = img.width / img.height;
                    let drawWidth, drawHeight, drawX, drawY;
                    
                    // Phương pháp FIT thay vì COVER để đảm bảo thấy toàn bộ ảnh
                    if (aspectRatio > areaWidth / imageAreaHeight) {
                        // Ảnh rộng hơn khung theo tỷ lệ
                        drawWidth = areaWidth - 10;
                        drawHeight = drawWidth / aspectRatio;
                        drawX = x + 5;
                        drawY = frameMargin + (imageAreaHeight - drawHeight) / 2;
                    } else {
                        // Ảnh cao hơn khung theo tỷ lệ
                        drawHeight = imageAreaHeight - 10;
                        drawWidth = drawHeight * aspectRatio;
                        drawX = x + (areaWidth - drawWidth) / 2;
                        drawY = frameMargin + 5;
                    }
                    
                    // Áp dụng bộ lọc trước khi vẽ ảnh
                    if (photo.filter !== 'normal') {
                        ctx.save();
                        const filterMap = {
                            'grayscale': 'grayscale(100%)',
                            'sepia': 'sepia(100%)',
                            'invert': 'invert(80%)',
                            'vintage': 'sepia(30%) saturate(140%) brightness(0.9) contrast(1.2)',
                            'pastel': 'brightness(1.1) saturate(1.3) contrast(0.9)',
                            'cute': 'brightness(1.1) saturate(1.5) contrast(0.85) hue-rotate(10deg)'
                        };
                        ctx.filter = filterMap[photo.filter] || 'none';
                    }
                    
                    // Vẽ ảnh với các thông số đã tính
                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                    
                    if (photo.filter !== 'normal') {
                        ctx.restore();
                    }
                    
                    resolve();
                };
                img.src = photo.src;
            });
        });
        
        Promise.all(promises).then(() => {
            // Thêm ngày tháng
            ctx.font = 'bold 16px Quicksand, sans-serif';
            ctx.fillStyle = '#ff6eb5';
            ctx.textAlign = 'right';
            
            const today = new Date();
            const dateStr = today.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            ctx.fillText(dateStr, canvasWidth - 25, canvasHeight - 25);
            
            // Thêm nhãn PhotoBooth
            ctx.font = 'italic 14px Quicksand, sans-serif';
            ctx.fillStyle = 'rgba(255, 110, 181, 0.7)';
            ctx.textAlign = 'left';
            ctx.fillText('PhotoBooth', 25, canvasHeight - 25);
            
            // Lưu ảnh ghép vào photosTaken
            const collageData = collageCanvas.toDataURL('image/png');
            photosTaken.push({
                src: collageData,
                filter: 'normal',
                date: new Date().toISOString(),
                isCollage: true,
                isFramed: true
            });
            
            // Hiển thị trong gallery
            displayPhotos();
            
            // Reset chế độ chụp
            collagePhotos = [];
            collagePreview.style.display = 'none';
            document.querySelector('input[value="single"]').checked = true;
            collageMode = 'single';
            
            // Kích hoạt các nút
            captureBtn.disabled = false;
            captureBtn.style.display = 'block';
            retakeBtn.style.display = 'none';
            downloadBtn.disabled = false;
        });
    }
    
    // Tạo collage cuối cùng
    function createCollage() {
        const collageCanvas = document.createElement('canvas');
        const ctx = collageCanvas.getContext('2d');
        
        // Xác định số hàng và cột dựa trên chế độ
        let rows, cols;
        if (collageMode === 'collage_2x2') {
            rows = 2;
            cols = 2;
        } else if (collageMode === 'collage_3x3') {
            rows = 3;
            cols = 3;
        } else if (collageMode === 'strip') {
            rows = 4;
            cols = 1;
        }
        
        // Xác định kích thước toàn cục của collage
        let canvasWidth, canvasHeight;
        const frameMargin = 40;
        const cellSpacing = 10;  // Khoảng cách giữa các ô
        
        if (collageMode === 'strip') {
            canvasWidth = 600;
            canvasHeight = 1200;
        } else if (collageMode === 'collage_3x3') {
            canvasWidth = canvasHeight = 900;
        } else { // 2x2
            canvasWidth = canvasHeight = 800;
        }
        
        collageCanvas.width = canvasWidth;
        collageCanvas.height = canvasHeight;
        
        // Fill background với màu pastel
        ctx.fillStyle = '#ffeaf7';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Vẽ khung ngoài - giống chế độ đơn
        const outerBorderWidth = 15;
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        gradient.addColorStop(0, '#ff9ed4');
        gradient.addColorStop(0.5, '#ffb6e1');
        gradient.addColorStop(1, '#ff9ed4');
        
        ctx.lineWidth = outerBorderWidth;
        ctx.strokeStyle = gradient;
        ctx.strokeRect(outerBorderWidth/2, outerBorderWidth/2, 
                     canvasWidth - outerBorderWidth, canvasHeight - outerBorderWidth);
        
        // Vẽ khung thứ hai mỏng bên trong
        const innerBorderWidth = 3;
        ctx.lineWidth = innerBorderWidth;
        ctx.strokeStyle = 'white';
        ctx.strokeRect(frameMargin/2, frameMargin/2, 
                     canvasWidth - frameMargin, canvasHeight - frameMargin);
        
        // Tính kích thước và vị trí cho từng ô ảnh
        const cellWidth = (canvasWidth - frameMargin * 2 - cellSpacing * (cols - 1)) / cols;
        const cellHeight = (canvasHeight - frameMargin * 2 - cellSpacing * (rows - 1)) / rows;
        
        // Vẽ từng ảnh vào grid 
        const promises = collagePhotos.map((photo, i) => {
            return new Promise((resolve) => {
                const row = Math.floor(i / cols);
                const col = i % cols;
                
                const img = new Image();
                img.onload = () => {
                    // Xác định vị trí từng ô
                    const x = frameMargin + col * (cellWidth + cellSpacing);
                    const y = frameMargin + row * (cellHeight + cellSpacing);
                    
                    // Vẽ khung mỏng cho từng ô ảnh
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = '#ffffff88';
                    ctx.strokeRect(x, y, cellWidth, cellHeight);
                    
                    // Tính kích thước và vị trí để ảnh vừa khít vào khung
                    const aspectRatio = img.width / img.height;
                    let drawWidth, drawHeight, drawX, drawY;
                    
                    // Phương pháp FIT thay vì COVER để đảm bảo thấy toàn bộ ảnh
                    if (aspectRatio > cellWidth / cellHeight) {
                        // Ảnh rộng hơn khung theo tỷ lệ
                        drawWidth = cellWidth - 10;
                        drawHeight = drawWidth / aspectRatio;
                        drawX = x + 5;
                        drawY = y + (cellHeight - drawHeight) / 2;
                    } else {
                        // Ảnh cao hơn khung theo tỷ lệ
                        drawHeight = cellHeight - 10;
                        drawWidth = drawHeight * aspectRatio;
                        drawX = x + (cellWidth - drawWidth) / 2;
                        drawY = y + 5;
                    }
                    
                    // Áp dụng bộ lọc
                    if (photo.filter !== 'normal') {
                        ctx.save();
                        const filterMap = {
                            'grayscale': 'grayscale(100%)',
                            'sepia': 'sepia(100%)',
                            'invert': 'invert(80%)',
                            'vintage': 'sepia(30%) saturate(140%) brightness(0.9) contrast(1.2)',
                            'pastel': 'brightness(1.1) saturate(1.3) contrast(0.9)',
                            'cute': 'brightness(1.1) saturate(1.5) contrast(0.85) hue-rotate(10deg)'
                        };
                        ctx.filter = filterMap[photo.filter] || 'none';
                    }
                    
                    // Vẽ ảnh - đảm bảo vừa khít với khung
                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                    
                    if (photo.filter !== 'normal') {
                        ctx.restore();
                    }
                    
                    resolve();
                };
                img.src = photo.src;
            });
        });
        
        Promise.all(promises).then(() => {
            // Thêm ngày tháng
            ctx.font = 'bold 16px Quicksand, sans-serif';
            ctx.fillStyle = '#ff6eb5';
            ctx.textAlign = 'right';
            
            const today = new Date();
            const dateStr = today.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            ctx.fillText(dateStr, canvasWidth - 25, canvasHeight - 25);
            
            // Thêm nhãn PhotoBooth
            ctx.font = 'italic 14px Quicksand, sans-serif';
            ctx.fillStyle = 'rgba(255, 110, 181, 0.7)';
            ctx.textAlign = 'left';
            ctx.fillText('PhotoBooth', 25, canvasHeight - 25);
            
            // Lưu collage vào photosTaken
            const collageData = collageCanvas.toDataURL('image/png');
            photosTaken.push({
                src: collageData,
                filter: 'normal',
                date: new Date().toISOString(),
                isCollage: true,
                isFramed: true
            });
            
            // Hiển thị trong gallery
            displayPhotos();
            
            // Reset chế độ collage
            collagePhotos = [];
            collagePreview.style.display = 'none';
            document.querySelector('input[value="single"]').checked = true;
            collageMode = 'single';
            
            // Kích hoạt các nút
            captureBtn.disabled = false;
            captureBtn.style.display = 'block';
            retakeBtn.style.display = 'none';
            downloadBtn.disabled = false;
        });
    }
    
    // Xóa ảnh
    function deletePhoto(index) {
        photosTaken.splice(index, 1);
        displayPhotos();
    }
    
    // Điều chỉnh hàm tải xuống để giữ nguyên tỷ lệ ảnh
    function downloadSinglePhoto(index) {
        const link = document.createElement('a');
        link.href = photosTaken[index].src;
        
        // Đặt tên file với thông tin phù hợp
        link.download = photosTaken[index].isCollage 
            ? `collage_${Date.now()}.png` 
            : (photosTaken[index].isFramed 
                ? `photo_framed_${Date.now()}.png` 
                : `photo_${Date.now()}.png`);
                
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Tải xuống ảnh mới nhất
    function downloadPhoto() {
        if (photosTaken.length > 0) {
            const photo = photosTaken[photosTaken.length - 1];
            const link = document.createElement('a');
            link.href = photo.src;
            link.download = photo.isCollage 
                ? `collage_${Date.now()}.png` 
                : `photo_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    // Chụp lại
    function retake() {
        retakeBtn.style.display = 'none';
        captureBtn.style.display = 'block';
        captureBtn.disabled = false;
        
        // Xóa tất cả stickers
        stickersPreview.innerHTML = '';
        activeStickers = [];
    }
    
    // Bắt đầu chế độ ghép ảnh
    function startCollageMode() {
        // Reset collage photos
        collagePhotos = [];
        
        // Get selected mode
        const selectedMode = document.querySelector('input[name="mode"]:checked').value;
        collageMode = selectedMode;
        
        if (collageMode !== 'single') {
            updateCollagePreview();
        }
    }
    
    // Hủy chế độ ghép ảnh
    function cancelCollage() {
        collagePhotos = [];
        collagePreview.style.display = 'none';
        document.querySelector('input[value="single"]').checked = true;
        collageMode = 'single';
        captureBtn.disabled = false;
    }
    
    // Thay đổi bộ lọc
    function changeFilter(filterName) {
        // Xóa bộ lọc cũ
        video.classList.remove(`filter-${currentFilter}`);
        // Thêm bộ lọc mới
        currentFilter = filterName;
        video.classList.add(`filter-${currentFilter}`);
        
        // Cập nhật trạng thái active của các nút
        filterBtns.forEach(btn => {
            if (btn.dataset.filter === filterName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // Chức năng bật/tắt lật ảnh
    function toggleFlip() {
        isFlipped = !isFlipped;
        
        // Cập nhật hiển thị video
        if (isFlipped) {
            video.style.transform = 'scaleX(-1)';
        } else {
            video.style.transform = 'scaleX(1)';
        }
        
        // Cập nhật giao diện nút
        flipButton.classList.toggle('active', isFlipped);
    }
    
    // Xử lý kéo thả sticker
    document.addEventListener('mousemove', (e) => {
        if (isDraggingSticker && draggedSticker) {
            const cameraRect = video.getBoundingClientRect();
            
            // Calculate new position (relative to camera container)
            let newX = e.clientX - dragStartX - cameraRect.left;
            let newY = e.clientY - dragStartY - cameraRect.top;
            
            // Constrain to camera boundaries
            newX = Math.max(0, Math.min(newX, cameraRect.width - draggedSticker.offsetWidth));
            newY = Math.max(0, Math.min(newY, cameraRect.height - draggedSticker.offsetHeight));
            
            // Update position
            draggedSticker.style.left = `${newX}px`;
            draggedSticker.style.top = `${newY}px`;
            
            // Update sticker in activeStickers array
            const stickerId = parseInt(draggedSticker.id.split('-')[1]);
            const stickerIndex = activeStickers.findIndex(s => s.id === stickerId);
            
            if (stickerIndex !== -1) {
                activeStickers[stickerIndex].x = newX;
                activeStickers[stickerIndex].y = newY;
            }
        }
    });
    
    // THÊM MỚI: Xử lý touch events cho stickers trên mobile
    document.addEventListener('touchmove', (e) => {
        if (isDraggingSticker && draggedSticker) {
            const touch = e.touches[0];
            const cameraRect = video.getBoundingClientRect();
            
            // Calculate new position (relative to camera container)
            let newX = touch.clientX - dragStartX - cameraRect.left;
            let newY = touch.clientY - dragStartY - cameraRect.top;
            
            // Constrain to camera boundaries
            newX = Math.max(0, Math.min(newX, cameraRect.width - draggedSticker.offsetWidth));
            newY = Math.max(0, Math.min(newY, cameraRect.height - draggedSticker.offsetHeight));
            
            // Update position
            draggedSticker.style.left = `${newX}px`;
            draggedSticker.style.top = `${newY}px`;
            
            // Update sticker in activeStickers array
            const stickerId = parseInt(draggedSticker.id.split('-')[1]);
            const stickerIndex = activeStickers.findIndex(s => s.id === stickerId);
            
            if (stickerIndex !== -1) {
                activeStickers[stickerIndex].x = newX;
                activeStickers[stickerIndex].y = newY;
            }
            
            // Ngăn chặn scroll khi kéo sticker
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchend', () => {
        isDraggingSticker = false;
        draggedSticker = null;
    });
    
    // Tải stickers
    function preloadStickers() {
        // Preload sticker images
        const stickerNames = ['crown', 'heart', 'star', 'sunglasses', 'hat', 'butterfly'];
        
        // Thông báo nếu không tìm thấy sticker
        const missingStickers = [];
        
        stickerNames.forEach(name => {
            const img = new Image();
            img.onerror = () => {
                console.warn(`Không thể tải sticker: ${name}. Vui lòng kiểm tra đường dẫn.`);
                missingStickers.push(name);
            };
            img.src = `stickers/${name}.png`;
        });
        
        // Nếu thiếu sticker, hiển thị thông báo
        if (missingStickers.length > 0) {
            console.warn(`
                Để stickers hoạt động, vui lòng tạo thư mục 'stickers' và thêm các file ảnh: 
                ${missingStickers.join(', ')}.png
            `);
        }
    }
    
    // Sự kiện
    captureBtn.addEventListener('click', capturePhoto);
    downloadBtn.addEventListener('click', downloadPhoto);
    retakeBtn.addEventListener('click', retake);
    flipButton.addEventListener('click', toggleFlip);
    
    collageBtn.addEventListener('click', () => {
        startCollageMode();
    });
    
    finishCollageBtn.addEventListener('click', () => {
        if (collagePhotos.length > 0) {
            createCollage();
        }
    });
    
    cancelCollageBtn.addEventListener('click', cancelCollage);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => changeFilter(btn.dataset.filter));
    });
    
    stickerBtns.forEach(btn => {
        btn.addEventListener('click', () => addSticker(btn.dataset.sticker));
    });
    
    modeOptions.forEach(option => {
        option.addEventListener('change', () => {
            collageMode = option.value;
            if (collageMode !== 'single') {
                collagePhotos = [];
                updateCollagePreview();
            } else {
                collagePreview.style.display = 'none';
            }
        });
    });
    
    // Đặt bộ lọc mặc định là normal
    filterBtns[0].classList.add('active');
    
    // Tải stickers
    preloadStickers();
    
    // Khởi động camera khi trang được tải
    startCamera();
    
    // THÊM MỚI: Xử lý hướng màn hình thay đổi
    window.addEventListener('orientationchange', function() {
        // Tạm dừng 500ms để đợi trình duyệt cập nhật kích thước
        setTimeout(() => {
            if (collageMode !== 'single' && collagePreview.style.display !== 'none') {
                updateCollagePreview();
            }
        }, 500);
    });
});