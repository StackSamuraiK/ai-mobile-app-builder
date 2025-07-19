// attaches the userId field to the Request object
// enriches the Request object

declare namespace Express{
    interface Request{
        userId? : number;
    }
}