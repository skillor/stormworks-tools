import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { XMLParser } from 'fast-xml-parser';

type DisplayType = {title: string, ignore: boolean, input: boolean};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
  }

  xmlInput = '';
  parseError = '';
  out: {
    [bodyIndex: number]:
    {
      name: string,
      channel: number,
      type: DisplayType,
    }[]
  } = {};

  displayTypes: { [key: string]: DisplayType } = {
    '0': {title: 'None', ignore: true, input: false},
    '1': {title: 'Dial', ignore: false, input: false},

    '3': {title: 'Button', ignore: false, input: true},

    '5': {title: 'Seven Segment', ignore: false, input: false},
  }

  defaultType = '1';
  defaultChannel = 0;

  showLogic() {
    this.parseError = '';
    try {
      this.parseXML();
    } catch (e) {
      this.parseError = String(e);
    }
  }

  parseXML() {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_', // you have assign this so use this to access the attribute
    });

    const jObj = parser.parse(this.xmlInput);

    this.out = {};
    jObj['vehicle']['bodies']['body'].forEach((body: any, bodyIndex: number) => {
      for (const comp of body['components']['c']) {
        // console.log(comp)
        if (comp['@_d'] == 'instrument_display') {
          for (const dp of ['display_1', 'display_2', 'display_3', 'display_4']) {
            if (!this.out[bodyIndex]) this.out[bodyIndex] = [];
            const type = this.displayTypes[comp['o'][dp]['@_type'] || this.defaultType];
            this.out[bodyIndex].push({
              name: comp['o'][dp]['@_name'],
              channel: Number(comp['o'][dp]['@_channel'] || this.defaultChannel) + 1,
              type,
            });
          }
        }
      }
      if (this.out[bodyIndex]) {
        this.out[bodyIndex].sort((a, b) => a.channel - b.channel);
      }
    });
  }

}
