import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      { path: 'lista', loadChildren: () => import('../lista/lista.module').then(m => m.ListaModule) },
      { path: 'tiendas', loadChildren: () => import('../tiendas/tiendas.module').then(m => m.TiendasModule) },
      { path: 'escaner', loadChildren: () => import('../escaner/escaner.module').then(m => m.EscanerModule) },
      { path: 'comparador', loadChildren: () => import('../comparador/comparador.module').then(m => m.ComparadorModule) },
      { path: 'historial', loadChildren: () => import('../historial/historial.module').then(m => m.HistorialModule) },
      { path: '', redirectTo: '/tabs/lista', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: '/tabs/lista', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsRoutingModule {}
