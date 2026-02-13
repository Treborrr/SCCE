import { Strategy } from 'passport-jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private usuariosService;
    constructor(usuariosService: UsuariosService);
    validate(payload: any): Promise<any>;
}
export {};
