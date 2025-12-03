import { Public } from '@/shared/decorators';
import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { SignedUrlParamsDto } from './dtos';
import { FileDeliveryService } from './services/file-delivery.service';

@Controller('a')
@Public()
@ApiExcludeController()
export class StorageController {
  constructor(private readonly fileDeliveryService: FileDeliveryService) {}

  @Get('*path')
  async serveFile(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: SignedUrlParamsDto
  ) {
    return this.fileDeliveryService.serveFile(req, res, query);
  }
}
