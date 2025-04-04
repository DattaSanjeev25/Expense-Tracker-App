import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { LoadingService } from './services/loading.service';
import { BehaviorSubject } from 'rxjs';

describe('AppComponent', () => {
  let loadingService: jasmine.SpyObj<LoadingService>;

  beforeEach(async () => {
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', [], {
      loading$: new BehaviorSubject<boolean>(false)
    });

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: LoadingService, useValue: loadingServiceSpy }
      ]
    }).compileComponents();

    loadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have loading$ observable', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.loading$).toBeTruthy();
  });

  it('should render router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
