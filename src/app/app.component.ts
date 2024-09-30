import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { XMLParser } from 'fast-xml-parser';
import { FileService } from './shared/file/file.service';

type DisplayType = {title: string, ignore: boolean, input: boolean, number: boolean};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule],
  providers: [FileService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(private fileService: FileService) {}

  parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_', // you have assign this so use this to access the attribute
  });

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
    '0': {title: 'None', ignore: true, input: false, number: false},
    '1': {title: 'Dial', ignore: false, input: false, number: true},

    '2': {title: 'Indicator', ignore: false, input: false, number: false},

    '3': {title: 'Button', ignore: false, input: true, number: false},

    '4': {title: 'Gauge', ignore: false, input: false, number: true},

    '5': {title: 'Seven Segment', ignore: false, input: false, number: true},

    '8': {title: 'Arrow Button', ignore: false, input: true, number: false},

    '11': {title: 'Flip Switch', ignore: false, input: true, number: false},
    '12': {title: 'Radial Segment', ignore: false, input: false, number: true},
    '13': {title: 'Bar Segment', ignore: false, input: false, number: true},

  }

  unknownType: DisplayType = {title: 'Unknown', ignore: false, input: false, number: false};

  defaultType = '1';
  defaultChannel = 0;

  loadXMLFile() {
    this.fileService.loadTextFile('text/xml').subscribe(text => this.showLogic(text));
  }

  showLogic(xmlInput: string) {
    this.parseError = '';
    try {
      this.parseXML(xmlInput);
    } catch (e) {
      this.parseError = String(e);
    }
  }

  parseXML(xmlInput: string) {
    const jObj = this.parser.parse(xmlInput);

    this.out = {};
    jObj['vehicle']['bodies']['body'].forEach((body: any, bodyIndex: number) => {
      for (const comp of body['components']['c']) {
        // console.log(comp)
        if (comp['@_d'] == 'instrument_display') {
          for (const dp of ['display_1', 'display_2', 'display_3', 'display_4']) {
            if (!this.out[bodyIndex]) this.out[bodyIndex] = [];
            const type = this.displayTypes[comp['o'][dp]['@_type'] || this.defaultType] || this.unknownType;
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
