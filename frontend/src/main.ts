import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowForwardOutline,
  barbellOutline,
  businessOutline,
  calendarNumberOutline,
  calendarOutline,
  cardOutline,
  cashOutline,
  chevronForwardOutline,
  clipboardOutline,
  createOutline,
  ellipsisHorizontal,
  filterOutline,
  fitnessOutline,
  gridOutline,
  peopleOutline,
  personAddOutline,
  receiptOutline,
  refreshOutline,
  ribbonOutline,
  trashOutline,
} from 'ionicons/icons';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

addIcons({
  'add-outline': addOutline,
  'arrow-forward-outline': arrowForwardOutline,
  'barbell-outline': barbellOutline,
  'business-outline': businessOutline,
  'calendar-number-outline': calendarNumberOutline,
  'calendar-outline': calendarOutline,
  'card-outline': cardOutline,
  'cash-outline': cashOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'clipboard-outline': clipboardOutline,
  'create-outline': createOutline,
  'ellipsis-horizontal': ellipsisHorizontal,
  'filter-outline': filterOutline,
  'fitness-outline': fitnessOutline,
  'grid-outline': gridOutline,
  'people-outline': peopleOutline,
  'person-add-outline': personAddOutline,
  'receipt-outline': receiptOutline,
  'refresh-outline': refreshOutline,
  'ribbon-outline': ribbonOutline,
  'trash-outline': trashOutline,
});

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(withFetch()),
    provideIonicAngular(),
    provideRouter(routes, withComponentInputBinding()),
  ],
}).catch((error) => console.error(error));