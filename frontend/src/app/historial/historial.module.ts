import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HistorialPage } from './historial.page';
import { CantidadesModalComponent } from './cantidades-modal.component';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: HistorialPage }])
  ],
  declarations: [HistorialPage, CantidadesModalComponent]
})
export class HistorialModule {}
