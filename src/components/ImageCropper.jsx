import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './ui/button';
import { IconCheck, IconX, IconUpload, IconUser, IconCamera } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';

// Helper to get cropped image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

export async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, mimeType = 'image/jpeg') {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, mimeType, mimeType === 'image/jpeg' ? 0.9 : undefined);
  });
}

export default function ImageCropper({ onCropDone, currentAvatar }) {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileType = file.type;
      const fileExt = file.name.split('.').pop().toLowerCase();
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/avif'
      ];
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];

      if (!allowedTypes.includes(fileType) && !allowedExtensions.includes(fileExt)) {
        alert('Invalid file format. Only JPEG, PNG, GIF, WEBP, SVG, and AVIF images are allowed.');
        e.target.value = ''; // clear input
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUpload = async () => {
    if (!image || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const getMimeTypeFromDataUrl = (dataUrl) => {
        const match = dataUrl.match(/^data:([^;]+);/);
        const mime = match ? match[1] : 'image/jpeg';
        if (mime === 'image/svg+xml' || mime === 'image/gif') {
          return 'image/png';
        }
        return mime;
      };

      const getExtensionFromMimeType = (mime) => {
        switch (mime) {
          case 'image/png': return 'png';
          case 'image/webp': return 'webp';
          case 'image/avif': return 'avif';
          case 'image/jpeg':
          default:
            return 'jpg';
        }
      };

      const mimeType = getMimeTypeFromDataUrl(image);
      const fileExt = getExtensionFromMimeType(mimeType);
      const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels, 0, mimeType);
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage.from('avatars').upload(filePath, croppedImageBlob, {
        contentType: mimeType,
      });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      onCropDone(publicUrlData.publicUrl);
      setImage(null); // Reset after upload
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!image) {
    return (
      <div className="flex items-center gap-5 p-2">
        <div className="relative group rounded-full overflow-hidden w-24 h-24 border-2 border-border/60 bg-muted/30 flex-shrink-0 flex items-center justify-center">
          {currentAvatar ? (
            <img src={currentAvatar} alt="Current Profile" className="w-full h-full object-cover" />
          ) : (
            <IconUser className="w-10 h-10 text-muted-foreground/50" />
          )}
          
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
            <IconCamera className="w-6 h-6 mb-1" />
          </div>
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/gif, image/webp, image/svg+xml, image/avif" 
            onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            title="Change Picture"
          />
        </div>
        
        <div className="flex flex-col">
          <div className="relative inline-block mb-1">
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/gif, image/webp, image/svg+xml, image/avif" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
            <Button type="button" variant="outline" size="sm" className="gap-2 pointer-events-none w-fit">
              <IconUpload className="w-4 h-4" />
              {currentAvatar ? 'Change Picture' : 'Upload Picture'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, WEBP, SVG or AVIF formats supported.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>
      <div className="flex flex-col space-y-1">
        <label className="text-xs text-muted-foreground">Zoom</label>
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          aria-labelledby="Zoom"
          onChange={(e) => setZoom(e.target.value)}
          className="w-full accent-primary"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setImage(null)} disabled={uploading}>
          <IconX className="w-4 h-4 mr-2" /> Change
        </Button>
        <Button type="button" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : <><IconCheck className="w-4 h-4 mr-2" /> Upload</>}
        </Button>
      </div>
    </div>
  );
}
