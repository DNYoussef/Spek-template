import {
  Controller,
  Post,
  Body,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ComputerUseService } from './computer-use.service';
import { ComputerActionValidationPipe } from './dto/computer-action-validation.pipe';
import { ComputerActionDto } from './dto/computer-action.dto';

@Controller('computer-use')
export class ComputerUseController {
  private readonly logger = new Logger(ComputerUseController.name);

  constructor(private readonly computerUseService: ComputerUseService) {}

  @Post()
  async action(
    @Body(new ComputerActionValidationPipe()) params: ComputerActionDto,
  ) {
    try {
      // don't log base64 data
      const paramsCopy = { ...params };
      if (paramsCopy.action === 'write_file') {
        paramsCopy.data = 'base64 data';
      }
      this.logger.log(`Computer action request: ${JSON.stringify(paramsCopy)}`);
      return await this.computerUseService.action(params);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error executing computer action: ${errorMessage}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to execute computer action: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
