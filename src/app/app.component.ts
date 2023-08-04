import {Component, OnInit} from '@angular/core';
import * as XLSX from 'xlsx';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';

type AOA = any[][];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'vanvoitthoi';
  data: any;
  input;
  dataByKey = [
    {key: 'A', data: []},
    {key: 'B', data: []},
    {key: 'C', data: []},
    {key: 'CH', data: []},
    {key: 'D', data: []},
    {key: 'Đ', data: []},
    {key: 'G', data: []},
    {key: 'GH', data: []},
    {key: 'GI', data: []},
    {key: 'H', data: []},
    {key: 'K', data: []},
    {key: 'KH', data: []},
    {key: 'L', data: []},
    {key: 'M', data: []},
    {key: 'N', data: []},
    {key: 'NG', data: []},
    {key: 'NGH', data: []},
    {key: 'NH', data: []},
    {key: 'P', data: []},
    {key: 'Q', data: []},
    {key: 'QU', data: []},
    {key: 'R', data: []},
    {key: 'S', data: []},
    {key: 'T', data: []},
    {key: 'TH', data: []},
    {key: 'TR', data: []},
    {key: 'V', data: []},
    {key: 'X', data: []},
    {key: 'Other', data: []}
  ];

  searchedBest = [];
  searchedSecondBest = [];
  searchBad = [];
  showBest = true;
  showSecondBest = false;
  showBad = false;
  isLoading = new BehaviorSubject(false);

  constructor(private httpClient: HttpClient) {
  }

  ngOnInit(): void {
    this.readData();
  }

  // #region public function
  search(value): void {
    if (!value) {
      return;
    }
    this.isLoading.next(true);
    this.resetValue();
    value = value.toUpperCase();
    this.input = value;
    const words = this.input.split(' ');
    const nguyenAms = [];
    setTimeout(() => {
      // Lọc lấy phụ âm Xin chao => ['in', 'ao']
      words.forEach(word => {
        const nguyenAmData = this.dataByKey.filter(dbk => word.toUpperCase().startsWith(dbk.key))
          .sort((a, b) => a.key.length > b.key.length ? -1 : 1);
        const nguyenAm = nguyenAmData && nguyenAmData[0].key;
        const phuAm = word.replace(nguyenAm, '');
        nguyenAms.push(phuAm);
      });

      // Thêm các nguyên âm vào
      const preFinalWords = [];
      nguyenAms.forEach(nguyenAm => {
        const addedWords = [];
        this.dataByKey.forEach(dbk => {
          if (dbk.key !== 'A' && dbk.key !== 'Other') {
            addedWords.push(dbk.key + nguyenAm);
          }
        });
        preFinalWords.push(addedWords);
      });

      // Lấy ra các từ tổ hợp
      const finalWordsArray = this.generateCombinations(preFinalWords);
      const finalWords = finalWordsArray.map(fwa => {
        const word = fwa.toString().replaceAll(',', ' ');
        return word.charAt(0) + word.substring(1).toLowerCase();
      });

      // đưa các từ vào list best, second best, bad
      finalWords.forEach(fw => {
        let pushed = false;
        this.dataByKey.forEach(dbk => {
          if (fw.startsWith(dbk.key)) {
            dbk.data.forEach(dataWord => {
              if (dataWord[0].toUpperCase() === fw.toUpperCase()) {
                this.searchedBest.push({word: fw, description: dataWord[1]});
                pushed = true;
              } else if (this.removeAccents(dataWord[0].toUpperCase()) === this.removeAccents(fw.toUpperCase())) {
                this.searchedSecondBest.push({word: fw, description: dataWord[1]});
                pushed = true;
              }
            });
          }
        });
        if (!pushed) {
          this.searchBad.push({word: fw, description: ''});
        }
      });
      this.isLoading.next(false);
    }, 100);
  }
  blurInput(value): void {
    this.input = value;
  }
  changeShow(option: 'best' | 'second' | 'bad'): void {
    switch (option) {
      case 'best':
        this.showBest = !this.showBest;
        break;
      case 'second':
        this.showSecondBest = !this.showSecondBest;
        break;
      case 'bad':
        this.showBad = !this.showBad;
        break;
    }
  }
  // #endregion

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
          this.data.forEach(d => {
            const word = d[0];
            let added = false;
            this.dataByKey.forEach(dbk => {
              if (word && word.toUpperCase().startsWith(dbk.key)) {
                dbk.data.push(d);
                added = true;
              }
            });
            if (!added) {
              this.dataByKey.find(dbk => dbk.key === 'Other').data.push(d);
            }
          });
        };
        reader.readAsBinaryString(data);
      });
  }
  private generateCombinations(arrays, currentCombination = [], index = 0, result = []): any {
    if (index === arrays.length) {
      result.push(currentCombination);
      return;
    }

    const currentArray = arrays[index];
    for (const item of currentArray) {
      const newCombination = [...currentCombination, item];
      this.generateCombinations(arrays, newCombination, index + 1, result);
    }

    return result;
  }
  private removeAccents(str): string {
    return str.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  private resetValue(): void {
    this.showBest = true;
    this.showSecondBest = false;
    this.showBad = false;
    this.searchedBest = [];
    this.searchedSecondBest = [];
    this.searchBad = [];
  }
  // #endregion
}
