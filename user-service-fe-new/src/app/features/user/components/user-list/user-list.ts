// import { Component, inject, signal, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
// import { UserService, User, UsersParams, Pagination } from '../../../../core/services/user.service';

// @Component({
//     selector: 'app-user-list',
//     standalone: true,
//     imports: [CommonModule, ReactiveFormsModule],
//     templateUrl: './user-list.component.html',
//     styleUrls: ['./user-list.component.scss']
// })
// export class UserListComponent implements OnInit {
//     private fb = inject(FormBuilder);
//     private userService = inject(UserService);

//     users = signal<User[]>([]);

//     loading = signal<boolean>(false);
//     errormsg = signal<string | null>(null);
//     pagination = signal<Pagination>({
//         page: 1,
//         limit: 10,
//         total: 0,
//         total_pages: 0,
//     });

//     filterForm = this.fb.group({
//         search: [''],
//         first_name: [''],
//         last_name: [''],
//         gender: [''],
//         birth_date_from: [''],
//         birth_date_to: [''],
//     });

//     ngOnInit(): void {
//         this.loadUser();
//     }

//     loadUser(): void {
//         this.loading.set(true);
//         this.errormsg.set(null);

//         const params: UsersParams = {
//             page: this.pagination().page,
//             limit: this.pagination().limit,
//         };

//         const formValue = this.filterForm.value;
//         if (formValue.search) params.search = formValue.search;
//         if (formValue.first_name) params.first_name = formValue.first_name;
//         if (formValue.last_name) params.last_name = formValue.last_name;
//         if (formValue.gender) params.gender = formValue.gender as 'male' | 'female' | 'other';
//         if (formValue.birth_date_from) params.birth_date_from = formValue.birth_date_from;
//         if (formValue.birth_date_to) params.birth_date_to = formValue.birth_date_to;

//         this.userService.getUsers(params).subscribe({
//             next: (response: UsersResponse) => {
//                 this.loading.set(false);
//                 if (response.success && response.data) {
//                     this.users.set(response.data);
//                     this.pagination.set(response.pagination);
//                 } else {
//                     this.errormsg.set(response.message || 'Failed to load users');

//                 }
//             },
//             error: (err) => {
//                 this.loading.set(false);
//                 this.errormsg.set(err.message || 'Failed to load users');
//                 console.error('Error loading users:', err);
//             },
//         });
//     }
// }
