export interface IVerifyTokenResult {
  isExpired: boolean;
  isCorrect: boolean;

  // result of both props above
  isValid: boolean;
}
