import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-lightbox.component.html',
  styleUrls: ['./image-lightbox.component.scss'],
})
export class ImageLightboxComponent {
  images = input.required<string[]>();
  initialIndex = input<number>(0);
  open = input<boolean>(false);
  closed = output<void>();

  currentIndex = signal<number>(0);

  currentImage = computed(() => {
    const imgs = this.images();
    const idx = this.currentIndex();
    return imgs[idx] || '';
  });

  imageCounter = computed(() => {
    return `${this.currentIndex() + 1} / ${this.images().length}`;
  });

  ngOnInit() {
    this.currentIndex.set(this.initialIndex());
  }

  close() {
    this.closed.emit();
  }

  nextImage() {
    const max = this.images().length - 1;
    if (this.currentIndex() < max) {
      this.currentIndex.update(i => i + 1);
    }
  }

  previousImage() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
    }
  }

  goToImage(index: number) {
    this.currentIndex.set(index);
  }

  onBackdropClick(event: MouseEvent) {
    
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close();
    } else if (event.key === 'ArrowRight') {
      this.nextImage();
    } else if (event.key === 'ArrowLeft') {
      this.previousImage();
    }
  }
}
