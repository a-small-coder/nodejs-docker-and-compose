import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  /**
   * Заглушка: отправка почтовых адресов желающим скинуться.
   * В реальной реализации здесь отправка писем (nodemailer и т.п.).
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async notifyOfferParticipants(
    _wishId: number,
    _offerIds: number[],
  ): Promise<void> {
    // Заглушка по заданию
  }
}
