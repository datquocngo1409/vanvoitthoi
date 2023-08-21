import {Component, OnInit} from '@angular/core';
import * as XLSX from 'xlsx';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'vanvoitthoi';
  data: any;
  sameList = [];
  semiSameList = [];
  input;
  isLoading = new BehaviorSubject(false);

  constructor(private httpClient: HttpClient) {
  }

  ngOnInit(): void {
    this.readData();
  }

  // #region private function
  private readData(): void {
    this.httpClient.get('assets/data/data.xlsx', {responseType: 'blob'})
      .subscribe((data: any) => {
        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
          const bstr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];
          this.data = XLSX.utils.sheet_to_json(ws, {header: 1});
        };
        reader.readAsBinaryString(data);
      });
  }
  private removeAccents(str): string {
    return str.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  // #endregion
  search(value: string): void {
    this.reset();
    const valueSplit = value.split(' ');
    this.data.forEach(d => {
      const dSplit = d[0].split(' ');
      if (dSplit.length === valueSplit.length) {
        let same = 0;
        let semiSame = 0;
        for (let i = 0; i < valueSplit.length; i++) {
          if (this.tachPhuAmDau(valueSplit[i]) === this.tachPhuAmDau(dSplit[i])) {
            same++;
            semiSame++;
          } else if (this.tachPhuAmDau(this.removeAccents(valueSplit[i])) === this.tachPhuAmDau(this.removeAccents(dSplit[i]))) {
            semiSame++;
          }
        }
        if (same === valueSplit.length) {
          this.sameList.push(d);
        } else if (semiSame === valueSplit.length) {
          this.semiSameList.push(d);
        }
      }
    });
  }

  private tachPhuAmDau(text): string {
    const phuAm = [
      'b', 'ch', 'c', 'd', 'đ', 'gh', 'g', 'h', 'kh', 'k', 'l', 'm', 'nh', 'ng', 'ngh', 'n', 'ph', 'p', 'q', 'r', 's', 'th', 'tr', 't', 'v', 'x'
    ];

    for (const pA of phuAm) {
      if (text.toLowerCase().startsWith(pA)) {
        return text.toLowerCase().replace(pA, '');
      }
    }

    return ''; // Trả về chuỗi rỗng nếu không tìm thấy phụ âm đầu
  }
  private reset(): any {
    this.sameList = [];
    this.semiSameList = [];
  }

  addExcelFile(): void {
    this.httpClient.get('assets/data/data.xlsx', {responseType: 'blob'})
      .subscribe((data: any) => {
        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
          const bstr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];
          const dataToAdd = ['New'];
          XLSX.utils.sheet_add_json(ws, dataToAdd);
        };
        reader.readAsBinaryString(data);
      });

    console.log('Row added successfully.');
  }
}
