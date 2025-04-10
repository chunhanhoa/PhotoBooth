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
    
    // Khởi động camera
    async function startCamera() {
        try {
            // Hiển thị thông báo đang khởi động camera
            console.log('Đang khởi động camera...');
            const cameraStatus = document.createElement('div');
            cameraStatus.className = 'camera-status';
            cameraStatus.textContent = 'Đang kết nối camera...';
            document.querySelector('.camera-container').appendChild(cameraStatus);

            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            };
            
            console.log('Yêu cầu quyền truy cập camera với:', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Đã nhận stream camera:', stream);
            
            video.srcObject = stream;
            currentStream = stream;
            captureBtn.disabled = false;
            downloadBtn.disabled = true;
            
            // Xử lý sự kiện của video
            video.onloadedmetadata = () => {
                console.log('Video metadata đã tải. Kích thước:', video.videoWidth, 'x', video.videoHeight);
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                video.classList.add(`filter-${currentFilter}`);
                
                // Đảm bảo video hiển thị
                video.style.display = 'block';
                
                // Áp dụng trạng thái lật ảnh
                if (isFlipped) {
                    video.style.transform = 'scaleX(-1)';
                } else {
                    video.style.transform = 'scaleX(1)';
                }

                // Xóa thông báo status
                const statusElem = document.querySelector('.camera-status');
                if (statusElem) statusElem.remove();
            };
            
            // Sự kiện khi video bắt đầu phát
            video.onplay = () => {
                console.log('Video đang phát');
                captureBtn.disabled = false;
                downloadBtn.disabled = true;
            };
            
            // Thêm xử lý lỗi cho video
            video.onerror = (err) => {
                console.error('Lỗi video:', err);
                alert(`Lỗi hiển thị video: ${err.message}`);
            };
            
        } catch (err) {
            console.error('Lỗi chi tiết khi truy cập camera:', err);
            let errorMessage = 'Không thể truy cập camera. ';
            
            // Cung cấp thông báo lỗi chi tiết hơn
            if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage += 'Không tìm thấy camera. Vui lòng kiểm tra thiết bị camera của bạn.';
            } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage += 'Quyền truy cập camera bị từ chối. Vui lòng cấp quyền truy cập camera cho trang web này.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage += 'Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng các ứng dụng khác đang sử dụng camera.';
            } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
                errorMessage += 'Không thể sử dụng camera với các yêu cầu hiện tại. Thử lại với cài đặt thấp hơn.';
            } else {
                errorMessage += `Lỗi: ${err.message}`;
            }
            
            alert(errorMessage);
            
            // Hiển thị lỗi trong giao diện
            const cameraContainer = document.querySelector('.camera-container');
            cameraContainer.innerHTML = `
                <div class="camera-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${errorMessage}</p>
                    <button id="retry-camera" class="btn btn-primary">Thử lại</button>
                </div>
            `;
            
            // Thêm sự kiện nút thử lại
            document.getElementById('retry-camera').addEventListener('click', startCamera);
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
    
    // Chức năng chụp ảnh
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
        captureBtn.disabled = true;
        if (collageMode === 'single') {
            photosTaken.push({
                src: imgData,
                filter: currentFilter,
                date: new Date().toISOString()
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
        if (collageMode === 'strip') {
            collageContainer.style.gridTemplateRows = 'repeat(4, 1fr)';
        }
        
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'collage-item';
            
            if (i < collagePhotos.length) {
                const img = document.createElement('img');
                img.src = collagePhotos[i].src;
                img.classList.add(`filter-${collagePhotos[i].filter}`);
                img.style.objectFit = 'cover'; // Sử dụng object-fit: cover để fill vào khung
                cell.appendChild(img);
            } else {
                cell.classList.add('empty');
            }
            
            collageContainer.appendChild(cell);
        }
        
        collagePreview.style.display = 'block';
    }
    
    // Tạo ảnh ghép 2 ảnh song song
    function createSideBySideImage() {
        const collageCanvas = document.createElement('canvas');
        const ctx = collageCanvas.getContext('2d');
        
        // Tạo canvas với kích thước đủ cho 2 ảnh song song và tỷ lệ đẹp
        const canvasWidth = 1200;  // Chiều rộng cố định
        const canvasHeight = 600;  // Chiều cao cố định
        const imageWidth = canvasWidth / 2;
        const imageHeight = canvasHeight;
        
        collageCanvas.width = canvasWidth;
        collageCanvas.height = canvasHeight;
        
        // Fill background với màu pastel
        ctx.fillStyle = '#ffeaf7';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Vẽ khung ngoài
        ctx.strokeStyle = '#ff9ed4';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, canvasWidth - 10, canvasHeight - 10);
        
        // Vẽ từng ảnh với đúng tỷ lệ và fill vào khung
        const promises = collagePhotos.map((photo, index) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const x = index * imageWidth;
                    
                    // Vẽ khung cho mỗi ảnh
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(x + 5, 5, imageWidth - 10, imageHeight - 10);
                    
                    // Tính toán để ảnh fill trong khung
                    const aspectRatio = img.width / img.height;
                    let drawWidth, drawHeight, offsetX, offsetY;
                    
                    // Phương pháp COVER thay vì FIT để đảm bảo lấp đầy khung
                    if (aspectRatio > imageWidth / imageHeight) {
                        // Ảnh rộng hơn tỷ lệ khung
                        drawHeight = imageHeight;
                        drawWidth = drawHeight * aspectRatio;
                        offsetX = x + (imageWidth - drawWidth) / 2;
                        offsetY = 0;
                    } else {
                        // Ảnh cao hơn tỷ lệ khung
                        drawWidth = imageWidth;
                        drawHeight = drawWidth / aspectRatio;
                        offsetX = x;
                        offsetY = (imageHeight - drawHeight) / 2;
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
                    
                    // Vẽ ảnh fill vào khung
                    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                    
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
            ctx.font = '16px Quicksand, sans-serif';
            ctx.fillStyle = '#ff6eb5';
            ctx.textAlign = 'right';
            
            const today = new Date();
            const dateStr = today.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            ctx.fillText(dateStr, canvasWidth - 20, canvasHeight - 20);
            
            // Lưu ảnh ghép vào photosTaken
            const collageData = collageCanvas.toDataURL('image/png');
            photosTaken.push({
                src: collageData,
                filter: 'normal',
                date: new Date().toISOString(),
                isCollage: true
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
        
        // Điều chỉnh kích thước cho phù hợp với tỷ lệ
        const cellWidth = 300;
        const cellHeight = collageMode === 'strip' ? 200 : 300;
        const collageWidth = cellWidth * cols;
        const collageHeight = cellHeight * rows;
        
        collageCanvas.width = collageWidth;
        collageCanvas.height = collageHeight;
        
        // Fill background (màu pastel dễ thương)
        ctx.fillStyle = '#ffeaf7';
        ctx.fillRect(0, 0, collageWidth, collageHeight);
        
        // Vẽ khung và trang trí
        ctx.strokeStyle = '#ff9ed4';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, collageWidth - 10, collageHeight - 10);
        
        // Vẽ từng ảnh để fill vào khung
        const promises = collagePhotos.map((photo, i) => {
            return new Promise((resolve) => {
                const row = Math.floor(i / cols);
                const col = i % cols;
                
                const img = new Image();
                img.onload = () => {
                    const x = col * cellWidth;
                    const y = row * cellHeight;
                    
                    // Vẽ khung cho mỗi ảnh
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(x + 5, y + 5, cellWidth - 10, cellHeight - 10);
                    
                    // Tính toán để ảnh fill hoàn toàn vào khung, dùng phương pháp cover
                    const aspectRatio = img.width / img.height;
                    let drawWidth, drawHeight, offsetX, offsetY;
                    
                    // Phương pháp COVER thay vì FIT
                    if (aspectRatio > cellWidth / cellHeight) {
                        // Ảnh rộng hơn tỷ lệ ô
                        drawHeight = cellHeight;
                        drawWidth = drawHeight * aspectRatio;
                        offsetX = x + (cellWidth - drawWidth) / 2;
                        offsetY = y;
                    } else {
                        // Ảnh cao hơn tỷ lệ ô
                        drawWidth = cellWidth;
                        drawHeight = drawWidth / aspectRatio;
                        offsetX = x;
                        offsetY = y + (cellHeight - drawHeight) / 2;
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
                    
                    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                    
                    // Thêm hiệu ứng đổ bóng
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    
                    if (photo.filter !== 'normal') {
                        ctx.restore();
                    }
                    
                    resolve();
                };
                img.src = photo.src;
            });
        });
        
        Promise.all(promises).then(() => {
            // Thêm ngày tháng và trang trí
            ctx.font = '16px Quicksand, sans-serif';
            ctx.fillStyle = '#ff6eb5';
            ctx.textAlign = 'right';
            
            const today = new Date();
            const dateStr = today.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            ctx.fillText(dateStr, collageWidth - 20, collageHeight - 20);
            
            // Lưu collage vào photosTaken
            const collageData = collageCanvas.toDataURL('image/png');
            photosTaken.push({
                src: collageData,
                filter: 'normal',
                date: new Date().toISOString(),
                isCollage: true
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
    
    // Tải xuống một ảnh cụ thể
    function downloadSinglePhoto(index) {
        const link = document.createElement('a');
        link.href = photosTaken[index].src;
        link.download = photosTaken[index].isCollage 
            ? `collage_${Date.now()}.png` 
            : `photo_${Date.now()}.png`;
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
    
    document.addEventListener('mouseup', () => {
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

    // Khởi động camera khi trang được tải
    setTimeout(() => {
        console.log('Bắt đầu khởi tạo camera...');
        startCamera();
    }, 500);

    // Thêm một nút để khởi động lại camera trong trường hợp có vấn đề
    const restartCamBtn = document.createElement('button');
    restartCamBtn.className = 'btn btn-warning';
    restartCamBtn.innerHTML = '<i class="fas fa-sync"></i> Khởi động lại camera';
    restartCamBtn.style.display = 'none'; // Ẩn ban đầu
    restartCamBtn.addEventListener('click', () => {
        // Dừng stream hiện tại nếu có
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        startCamera();
    });
    document.querySelector('.controls').appendChild(restartCamBtn);
    
    // Hiện nút sau 5 giây nếu camera không hoạt động
    setTimeout(() => {
        if (!currentStream || !video.srcObject) {
            restartCamBtn.style.display = 'block';
        }
    }, 5000);
    
    // Đặt bộ lọc mặc định là normal
    filterBtns[0].classList.add('active');
    
    // Tải stickers
    preloadStickers();
});
