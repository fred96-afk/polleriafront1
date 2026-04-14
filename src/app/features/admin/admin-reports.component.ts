import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-reports',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReportsComponent {
  private readonly reportService = inject(ReportService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastrService);

  loadingPdf = signal(false);
  loadingExcel = signal(false);

  // Fecha de hoy por defecto
  today = new Date().toISOString().split('T')[0];

  reportForm = this.fb.group({
    startDate: [this.today, [Validators.required]],
    endDate: [this.today, [Validators.required]]
  });

  downloadPdf() {
    if (this.reportForm.invalid) return;

    this.loadingPdf.set(true);
    const { startDate, endDate } = this.reportForm.value;

    this.reportService.downloadSalesPdf(startDate!, endDate!).pipe(
      finalize(() => this.loadingPdf.set(false))
    ).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `reporte_ventas_${startDate}_${endDate}.pdf`);
        this.toastService.success('Reporte PDF generado');
      },
      error: (err) => {
        console.error('Error descargando PDF:', err);
        this.toastService.error('No se pudo generar el reporte PDF');
      }
    });
  }

  downloadExcel() {
    if (this.reportForm.invalid) return;

    this.loadingExcel.set(true);
    const { startDate, endDate } = this.reportForm.value;

    this.reportService.downloadSalesExcel(startDate!, endDate!).pipe(
      finalize(() => this.loadingExcel.set(false))
    ).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `reporte_ventas_${startDate}_${endDate}.xlsx`);
        this.toastService.success('Reporte Excel generado');
      },
      error: (err) => {
        console.error('Error descargando Excel:', err);
        this.toastService.error('No se pudo generar el reporte Excel');
      }
    });
  }

  private downloadFile(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
