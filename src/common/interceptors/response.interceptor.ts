// // common/interceptors/response.interceptor.ts
// import {
//   Injectable,
//   NestInterceptor,
//   ExecutionContext,
//   CallHandler,
// } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { Reflector } from '@nestjs/core';
// import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorators';

// @Injectable()
// export class ResponseInterceptor implements NestInterceptor {
//   constructor(private reflector: Reflector) {}

//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const message =
//       this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ||
//       'Success';

//     return next.handle().pipe(
//       map((data) => ({
//         success: true,
//         message,
//         data,
//       })),
//     );
//   }
// }
