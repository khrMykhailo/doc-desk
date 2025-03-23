import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDocumentModalComponent } from './add-document-modal.component';

describe('AddDocumentModalComponent', () => {
  let component: AddDocumentModalComponent;
  let fixture: ComponentFixture<AddDocumentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDocumentModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddDocumentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
